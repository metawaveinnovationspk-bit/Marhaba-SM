import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { createApiApp } from './apiApp';
import { lookupProductByBarcodeOrSku } from './calculations';
import { ROLE_DEFINITIONS, redactProductForRole } from './permissions';
import { INITIAL_STAFF_USERS } from './seedData';
import type { ErpProduct, StaffRoleId } from './types';

async function withTestServer(fn: (baseUrl: string) => Promise<void>) {
  const app = createApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to bind test server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function loginAs(baseUrl: string, identifier: string, pin = 'demo1234'): Promise<string> {
  const res = await fetch(`${baseUrl}/api/mgmt/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, pin }),
  });
  assert.equal(res.status, 200, `Expected login 200 for ${identifier}`);
  const data = (await res.json()) as { token: string };
  assert.ok(data.token);
  return data.token;
}

test('All 27 supermarket roles authenticate, load scoped bootstrap, enforce cost redaction, branch isolation, read-only audit & MIS limits', async () => {
  const allRoleIds = Object.keys(ROLE_DEFINITIONS) as StaffRoleId[];
  assert.equal(allRoleIds.length, 27, 'Expected exactly 27 supermarket roles');

  await withTestServer(async (baseUrl) => {
    for (const roleId of allRoleIds) {
      const seedUser = INITIAL_STAFF_USERS.find((u) => u.roleId === roleId);
      assert.ok(seedUser, `Missing seeded user for role ${roleId}`);

      const token = await loginAs(baseUrl, seedUser.email);
      const bootRes = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(bootRes.status, 200, `Bootstrap failed for role ${roleId}`);
      const boot = (await bootRes.json()) as {
        role: { id: string; canViewCostAndMargin: boolean; branchRestricted: boolean; isReadOnlyAudit?: boolean };
        permittedModules: { id: string }[];
        products: { purchaseCost: number | null; marginPercent: number | null }[];
        activeBranchScope: string;
        departmentMargins: unknown[];
        slowMovingSkus: unknown[];
      };

      assert.equal(boot.role.id, roleId);
      const expectedMods = Object.keys(ROLE_DEFINITIONS[roleId].modules);
      assert.deepEqual(
        boot.permittedModules.map((m) => m.id).sort(),
        [...expectedMods].sort(),
        `Module mismatch for ${roleId}`
      );

      // Verify cost/margin redaction enforcement
      if (!boot.role.canViewCostAndMargin) {
        assert.equal(boot.products[0].purchaseCost, null, `purchaseCost leaked to ${roleId}`);
        assert.equal(boot.products[0].marginPercent, null, `marginPercent leaked to ${roleId}`);
        assert.equal(boot.departmentMargins.length, 0, `departmentMargins leaked to ${roleId}`);
        assert.equal(boot.slowMovingSkus.length, 0, `slowMovingSkus leaked to ${roleId}`);
      } else {
        assert.notEqual(boot.products[0].purchaseCost, null, `purchaseCost hidden from authorized ${roleId}`);
      }

      // Verify branch restriction blocks Karachi access for Hyderabad-restricted accounts
      if (boot.role.branchRestricted && seedUser.branchId === 'hyderabad') {
        const crossBranchRes = await fetch(`${baseUrl}/api/mgmt/bootstrap?branchId=karachi-p10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const crossBoot = (await crossBranchRes.json()) as { activeBranchScope: string };
        assert.equal(crossBoot.activeBranchScope, 'hyderabad', `Cross-branch override leaked for ${roleId}`);
      }

      // Verify read-only auditors cannot mutate stock or create expenses
      if (boot.role.isReadOnlyAudit) {
        const adjRes = await fetch(`${baseUrl}/api/mgmt/inventory/adjustments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productId: 'olpers-milk-1l-carton',
            branchId: 'hyderabad',
            delta: -1,
            reason: 'Unauthorized auditor mutation test',
          }),
        });
        assert.equal(adjRes.status, 403, `Read-only auditor ${roleId} bypassed write block`);
      }
    }

    // Verify Director MIS is strictly blocked from approving financial / PO / price requests
    const dirPurchToken = await loginAs(baseUrl, 'faraz.purchasing@marhaba.demo');
    const opToken = await loginAs(baseUrl, 'catalog@marhaba.demo');
    const misToken = await loginAs(baseUrl, 'shahzad.mis@marhaba.demo');

    const opBoot = (await (
      await fetch(`${baseUrl}/api/mgmt/bootstrap`, { headers: { Authorization: `Bearer ${opToken}` } })
    ).json()) as { products: { id: string }[] };

    const priceReqRes = await fetch(`${baseUrl}/api/mgmt/offers/price-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({
        productId: opBoot.products[1].id,
        proposedPrice: 999,
        justification: 'MIS bypass security check',
      }),
    });
    assert.equal(priceReqRes.status, 201);
    const { approval } = (await priceReqRes.json()) as { approval: { id: string } };

    const misAttempt = await fetch(`${baseUrl}/api/mgmt/approvals/${approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${misToken}` },
      body: JSON.stringify({ decision: 'Approved' }),
    });
    assert.equal(misAttempt.status, 403, 'Director MIS must NEVER approve business price requests');

    // Clean approval by Director Purchasing
    const dirApprove = await fetch(`${baseUrl}/api/mgmt/approvals/${approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dirPurchToken}` },
      body: JSON.stringify({ decision: 'Approved' }),
    });
    assert.equal(dirApprove.status, 200);
  });
});

test('Scenario A: Cashier shift open -> POS barcode sale -> discount cap -> supervisor override -> card failure recovery -> close variance -> delete blocked', async () => {
  await withTestServer(async (baseUrl) => {
    const cashierToken = await loginAs(baseUrl, 'cashier.hyd@marhaba.demo');
    const supToken = await loginAs(baseUrl, 'pos.sup@marhaba.demo');

    // Close existing open shift for Usman first or use open shift
    const boot = (await (
      await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
        headers: { Authorization: `Bearer ${cashierToken}` },
      })
    ).json()) as {
      shifts: { id: string; cashierUserId: string; status: string; expectedCash: number }[];
      products: { id: string; sku: string; sellingPrice: number }[];
    };

    let openShift = boot.shifts.find(
      (s) => s.cashierUserId === 'usr-cashier-hyd' && s.status === 'Open'
    );
    if (!openShift) {
      const openRes = await fetch(`${baseUrl}/api/mgmt/pos/shifts/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({ branchId: 'hyderabad', openingFloat: 10000 }),
      });
      assert.equal(openRes.status, 201);
      openShift = ((await openRes.json()) as { shift: typeof openShift }).shift;
    }
    assert.ok(openShift);
    const prod = boot.products[0];

    // Discount above 5% rejected (403)
    const capRes = await fetch(`${baseUrl}/api/mgmt/pos/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        shiftId: openShift.id,
        branchId: 'hyderabad',
        items: [{ productId: prod.id, quantity: 1, discountPercent: 12 }],
        paymentMethod: 'Cash',
        cashReceived: 10000,
      }),
    });
    assert.equal(capRes.status, 403);

    // Request supervisor discount override & approve via POS Supervisor
    const ovrReqRes = await fetch(`${baseUrl}/api/mgmt/pos/discount-override-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        branchId: 'hyderabad',
        sku: prod.sku,
        requestedDiscountPercent: 12,
        reason: 'Damaged outer carton discount',
        amountPkr: 500,
      }),
    });
    assert.equal(ovrReqRes.status, 201);
    const { approval } = (await ovrReqRes.json()) as { approval: { id: string } };

    const supApproveRes = await fetch(`${baseUrl}/api/mgmt/approvals/${approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supToken}` },
      body: JSON.stringify({ decision: 'Approved', note: 'Verified carton scuff' }),
    });
    assert.equal(supApproveRes.status, 200);

    // Simulated card terminal timeout returns 402 without modifying stock
    const cardFailRes = await fetch(`${baseUrl}/api/mgmt/pos/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        shiftId: openShift.id,
        branchId: 'hyderabad',
        items: [{ productId: prod.id, quantity: 1, discountPercent: 12 }],
        paymentMethod: 'Card',
        cardTerminalFailed: true,
        supervisorOverrideId: approval.id,
      }),
    });
    assert.equal(cardFailRes.status, 402);

    // Recover using Split/Cash + Approved Supervisor Override -> 201
    const saleRes = await fetch(`${baseUrl}/api/mgmt/pos/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        shiftId: openShift.id,
        branchId: 'hyderabad',
        items: [{ productId: prod.id, quantity: 1, discountPercent: 12 }],
        paymentMethod: 'Split',
        cashReceived: 3000,
        cardAmount: 2000,
        supervisorOverrideId: approval.id,
      }),
    });
    assert.equal(saleRes.status, 201);
    const { sale, shift: updatedShift } = (await saleRes.json()) as {
      sale: { id: string; supervisorOverrideId?: string };
      shift: { expectedCash: number };
    };
    assert.equal(sale.supervisorOverrideId, approval.id);

    // Close shift with PKR 500 variance -> Pending Reconciliation
    const closeRes = await fetch(`${baseUrl}/api/mgmt/pos/shifts/${openShift.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({ declaredCash: updatedShift.expectedCash - 500 }),
    });
    assert.equal(closeRes.status, 200);
    const closedBody = (await closeRes.json()) as {
      shift: { status: string; variance: number };
    };
    assert.equal(closedBody.shift.status, 'Pending Reconciliation');
    assert.equal(closedBody.shift.variance, -500);

    // Delete blocked
    const delRes = await fetch(`${baseUrl}/api/mgmt/pos/sales/${sale.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert.equal(delRes.status, 403);
  });
});

test('Scenario B & C: PR -> PO conversion -> independent approval -> GRN -> Putaway -> Transfer -> Cycle Count -> AP Prepare -> Manager Release & Bank Settlement', async () => {
  await withTestServer(async (baseUrl) => {
    const buyerToken = await loginAs(baseUrl, 'buyer@marhaba.demo');
    const dirPurchToken = await loginAs(baseUrl, 'faraz.purchasing@marhaba.demo');
    const recToken = await loginAs(baseUrl, 'receiving@marhaba.demo');
    const stockToken = await loginAs(baseUrl, 'stock.controller@marhaba.demo');
    const invMgrToken = await loginAs(baseUrl, 'inventory@marhaba.demo');
    const apToken = await loginAs(baseUrl, 'ap@marhaba.demo');
    const accMgrToken = await loginAs(baseUrl, 'accounts@marhaba.demo');

    // Scenario C: Buyer converts approved PR-2026-031 to PO
    const convRes = await fetch(`${baseUrl}/api/mgmt/purchasing/requisitions/PR-2026-031/convert-to-po`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({}),
    });
    assert.equal(convRes.status, 201);
    const { purchaseOrder: convertedPo } = (await convRes.json()) as {
      purchaseOrder: { id: string; status: string; items: { productId: string; orderedQty: number }[] };
    };

    // If pending approval, approve via Director Purchasing
    if (convertedPo.status === 'Pending Approval') {
      const bootDir = (await (
        await fetch(`${baseUrl}/api/mgmt/bootstrap`, { headers: { Authorization: `Bearer ${dirPurchToken}` } })
      ).json()) as { approvals: { id: string; referenceId?: string }[] };
      const poApr = bootDir.approvals.find((a) => a.referenceId === convertedPo.id);
      assert.ok(poApr);
      const aprRes = await fetch(`${baseUrl}/api/mgmt/approvals/${poApr.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dirPurchToken}` },
        body: JSON.stringify({ decision: 'Approved' }),
      });
      assert.equal(aprRes.status, 200);
    }

    // Receiving Clerk posts partial GRN with 1 damaged unit
    const line = convertedPo.items[0];
    const grnRes = await fetch(`${baseUrl}/api/mgmt/purchasing/grn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recToken}` },
      body: JSON.stringify({
        poId: convertedPo.id,
        items: [{ productId: line.productId, acceptedQty: Math.max(1, line.orderedQty - 2), damagedQty: 1 }],
        discrepancyNote: '1 carton dented at dock',
      }),
    });
    assert.equal(grnRes.status, 201);
    const { invoice } = (await grnRes.json()) as { invoice: { id: string; threeWayMatchStatus: string } };

    // AP prepares payment (cannot directly release!)
    const prepRes = await fetch(`${baseUrl}/api/mgmt/finance/invoices/${invoice.id}/prepare`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apToken}` },
    });
    assert.equal(prepRes.status, 200);

    const apPayAttempt = await fetch(`${baseUrl}/api/mgmt/finance/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apToken}` },
    });
    assert.equal(apPayAttempt.status, 403, 'AP officer must not bypass Segregation of Duties to pay invoice');

    // Accounts Manager cannot release payment when 3-way match has Quantity Variance (must escalate to Director Accounts)
    const mgrVarianceAttempt = await fetch(`${baseUrl}/api/mgmt/finance/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accMgrToken}` },
    });
    assert.equal(mgrVarianceAttempt.status, 400, '3-Way variance must block Accounts Manager payment without Director escalation');

    const dirAccToken = await loginAs(baseUrl, 'sheeraz.accounts@marhaba.demo');
    const dirPayRes = await fetch(`${baseUrl}/api/mgmt/finance/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dirAccToken}` },
    });
    assert.equal(dirPayRes.status, 200);

    // AP reconciles bank card settlement batch
    const apBoot = (await (
      await fetch(`${baseUrl}/api/mgmt/bootstrap`, { headers: { Authorization: `Bearer ${apToken}` } })
    ).json()) as { bankSettlements: { id: string; posCardExpected: number }[] };
    assert.ok(apBoot.bankSettlements.length > 0);
    const bnkRes = await fetch(
      `${baseUrl}/api/mgmt/finance/bank-settlements/${apBoot.bankSettlements[0].id}/reconcile`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apToken}` },
        body: JSON.stringify({ bankSettledAmount: apBoot.bankSettlements[0].posCardExpected }),
      }
    );
    assert.equal(bnkRes.status, 200);

    // Scenario B: Putaway warehouse -> sales floor
    const putRes = await fetch(`${baseUrl}/api/mgmt/inventory/putaway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stockToken}` },
      body: JSON.stringify({
        productId: line.productId,
        branchId: 'hyderabad',
        quantity: 2,
        locationCode: 'HYD-A04',
      }),
    });
    assert.equal(putRes.status, 200);

    // Transfer dispatch (Hyderabad -> Karachi P10) & receive at destination with variance
    const trfRes = await fetch(`${baseUrl}/api/mgmt/inventory/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stockToken}` },
      body: JSON.stringify({
        productId: line.productId,
        fromBranchId: 'hyderabad',
        toBranchId: 'karachi-p10',
        quantity: 4,
      }),
    });
    assert.equal(trfRes.status, 201);
    const { transfer } = (await trfRes.json()) as { transfer: { id: string } };

    const recTrfRes = await fetch(`${baseUrl}/api/mgmt/inventory/transfers/${transfer.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${invMgrToken}` },
      body: JSON.stringify({ receivedQty: 3, damagedQty: 1, varianceNote: '1 torn in transit' }),
    });
    assert.equal(recTrfRes.status, 200);
    const recTrfBody = (await recTrfRes.json()) as { transfer: { status: string } };
    assert.equal(recTrfBody.transfer.status, 'Completed with Variance');

    // Cycle count variance + independent approval
    const cntRes = await fetch(`${baseUrl}/api/mgmt/inventory/cycle-counts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stockToken}` },
      body: JSON.stringify({
        productId: line.productId,
        branchId: 'hyderabad',
        physicalQty: 1,
        notes: 'Night aisle physical verification',
      }),
    });
    assert.equal(cntRes.status, 201);
    const cntBody = (await cntRes.json()) as { approval?: { id: string } };
    assert.ok(cntBody.approval);
    const cntApprove = await fetch(`${baseUrl}/api/mgmt/approvals/${cntBody.approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${invMgrToken}` },
      body: JSON.stringify({ decision: 'Approved', note: 'Approved physical count variance' }),
    });
    assert.equal(cntApprove.status, 200);
  });
});

test('Scenario D, E, F & G: Online order picking/dispatch/return disposition, catalog/MIS controls, equipment maintenance, HR roster & CEO 11-metric center', async () => {
  await withTestServer(async (baseUrl) => {
    const pickerToken = await loginAs(baseUrl, 'picker.hyd@marhaba.demo');
    const csToken = await loginAs(baseUrl, 'support@marhaba.demo');
    const accMgrToken = await loginAs(baseUrl, 'accounts@marhaba.demo');
    const opToken = await loginAs(baseUrl, 'catalog@marhaba.demo');
    const misToken = await loginAs(baseUrl, 'shahzad.mis@marhaba.demo');
    const maintToken = await loginAs(baseUrl, 'maintenance@marhaba.demo');
    const hrToken = await loginAs(baseUrl, 'hr@marhaba.demo');
    const ceoToken = await loginAs(baseUrl, 'riaz.ceo@marhaba.demo');

    // Scenario D: Public order -> Pick with substitution -> Complete pick -> Dispatch -> Return refund with Damaged Quarantine
    const pubCat = (await (await fetch(`${baseUrl}/api/public/catalog`)).json()) as {
      products: { id: string }[];
    };
    const ordRes = await fetch(`${baseUrl}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: 'audit-scenario-d-1',
        orderNumber: 'MRH-AUD-9901',
        branchId: 'hyderabad',
        customerName: 'Amina Farooq',
        customerPhone: '0301-8899112',
        fulfillmentMethod: 'delivery',
        addressSummary: 'Qasimabad Phase 1, Hyderabad',
        paymentMethod: 'cod',
        items: [{ productId: pubCat.products[0].id, quantity: 1 }],
      }),
    });
    assert.equal(ordRes.status, 201);
    const { order } = (await ordRes.json()) as {
      order: { id: string; orderNumber: string; totalAmount: number; items: { productId: string }[] };
    };

    const pickRes = await fetch(`${baseUrl}/api/mgmt/orders/${order.id}/pick`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pickerToken}` },
      body: JSON.stringify({
        productId: order.items[0].productId,
        pickedQty: 1,
        flaggedMissing: false,
        substituteNote: 'Fresh batch verified',
      }),
    });
    assert.equal(pickRes.status, 200);

    const dispRes = await fetch(`${baseUrl}/api/mgmt/orders/${order.id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pickerToken}` },
      body: JSON.stringify({ stage: 'Dispatched', packingVerified: true }),
    });
    assert.equal(dispRes.status, 200);
    const dispBody = (await dispRes.json()) as { order: { reservationStatus: string } };
    assert.equal(dispBody.order.reservationStatus, 'Deducted');

    // Customer Service creates return & requests refund with Damaged Quarantine disposition
    const caseRes = await fetch(`${baseUrl}/api/mgmt/customers/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csToken}` },
      body: JSON.stringify({
        customerName: 'Amina Farooq',
        maskedPhone: '0301-***-112',
        branchId: 'hyderabad',
        orderNumber: order.orderNumber,
        category: 'Return & Exchange',
        priority: 'High',
        notes: 'Pack leaking on arrival',
      }),
    });
    assert.equal(caseRes.status, 201);
    const { customerCase } = (await caseRes.json()) as { customerCase: { id: string } };

    const refReqRes = await fetch(`${baseUrl}/api/mgmt/customers/cases/${customerCase.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csToken}` },
      body: JSON.stringify({
        status: 'In Review',
        requestRefundAmount: order.totalAmount,
        refundDisposition: 'Damaged Quarantine',
      }),
    });
    assert.equal(refReqRes.status, 200);

    // Accounts Manager approves refund -> increases refundsDeducted in financeSummary
    const accBoot = (await (
      await fetch(`${baseUrl}/api/mgmt/bootstrap`, { headers: { Authorization: `Bearer ${accMgrToken}` } })
    ).json()) as { approvals: { id: string; referenceId?: string }[] };
    const refApr = accBoot.approvals.find((a) => a.referenceId === customerCase.id);
    assert.ok(refApr);
    const refApprove = await fetch(`${baseUrl}/api/mgmt/approvals/${refApr.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accMgrToken}` },
      body: JSON.stringify({ decision: 'Approved' }),
    });
    assert.equal(refApprove.status, 200);

    // Scenario E: Product duplicate SKU rejected (400), MIS disables account -> disabled token blocked (401), Sync drill
    const dupRes = await fetch(`${baseUrl}/api/mgmt/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({
        sku: 'MRH-DAI-101',
        barcode: '8961001011000',
        name: 'Duplicate Test',
        brand: 'Test',
        departmentId: 'dairy-bakery',
        subcategory: 'Milk',
        supplierId: 'sup-friesland',
        unitLabel: '1L',
        purchaseCost: 100,
        sellingPrice: 120,
      }),
    });
    assert.equal(dupRes.status, 400);

    const tempToken = await loginAs(baseUrl, 'sales.assistant@marhaba.demo');
    const disableRes = await fetch(`${baseUrl}/api/mgmt/settings/users/usr-sales-asst-hyd/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${misToken}` },
      body: JSON.stringify({ active: false }),
    });
    assert.equal(disableRes.status, 200);

    const disabledSessionRes = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(disabledSessionRes.status, 401, 'Disabled account session must immediately be invalidated');

    // Sync simulation & recovery
    const simRes = await fetch(`${baseUrl}/api/mgmt/settings/sync-simulate-issue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${misToken}` },
    });
    assert.equal(simRes.status, 200);
    const recSyncRes = await fetch(`${baseUrl}/api/mgmt/settings/sync-retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${misToken}` },
    });
    assert.equal(recSyncRes.status, 200);

    // Scenario F: Supermarket maintenance ticket lifecycle + HR roster assignment + Leave SoD
    const mntRes = await fetch(`${baseUrl}/api/mgmt/branches/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${maintToken}` },
      body: JSON.stringify({
        branchId: 'hyderabad',
        equipment: 'Dairy Chiller #03',
        issue: 'Compressor temperature drift (+6C)',
        priority: 'Urgent',
      }),
    });
    assert.equal(mntRes.status, 201);
    const { maintenanceTicket } = (await mntRes.json()) as { maintenanceTicket: { id: string } };

    const mntPatch = await fetch(`${baseUrl}/api/mgmt/branches/maintenance/${maintenanceTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${maintToken}` },
      body: JSON.stringify({ status: 'Verified Resolved' }),
    });
    assert.equal(mntPatch.status, 200);

    const attRes = await fetch(`${baseUrl}/api/mgmt/staff/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        userId: 'usr-cashier-hyd',
        branchId: 'hyderabad',
        shiftWindow: '02:00 PM – 10:00 PM',
        status: 'Scheduled',
      }),
    });
    assert.equal(attRes.status, 201);

    const lvSubmit = await fetch(`${baseUrl}/api/mgmt/staff/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({ leaveType: 'Casual', startDate: '2026-11-28', days: 1, reason: 'Family' }),
    });
    assert.equal(lvSubmit.status, 201);
    const { leaveRequest } = (await lvSubmit.json()) as { leaveRequest: { id: string } };

    const lvSelfApprove = await fetch(`${baseUrl}/api/mgmt/staff/leave/${leaveRequest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({ status: 'Approved' }),
    });
    assert.equal(lvSelfApprove.status, 403, 'HR manager must not approve own leave request');

    // Scenario G: CEO Executive Control Center data completeness
    const ceoBoot = (await (
      await fetch(`${baseUrl}/api/mgmt/bootstrap`, { headers: { Authorization: `Bearer ${ceoToken}` } })
    ).json()) as {
      financeSummary: { totalRevenue: number; refundsDeducted: number; grossMarginPercent: number; inventoryValuation: number; unpaidPayables: number };
      departmentMargins: unknown[];
      slowMovingSkus: unknown[];
      maintenanceTickets: unknown[];
      auditLogs: unknown[];
    };
    assert.ok(ceoBoot.financeSummary.totalRevenue > 0);
    assert.ok(ceoBoot.financeSummary.refundsDeducted >= order.totalAmount);
    assert.ok(ceoBoot.financeSummary.inventoryValuation > 0);
    assert.ok(ceoBoot.departmentMargins.length > 0);
    assert.ok(ceoBoot.slowMovingSkus.length > 0);
    assert.ok(ceoBoot.auditLogs.length > 0);
  });
});

test('Performance Benchmark: 250+ SKU POS lookup, catalogue sort/pagination & HTTP bootstrap response latency', async () => {
  // Construct synthetic 260-SKU catalog
  const syntheticProducts: ErpProduct[] = Array.from({ length: 260 }, (_, idx) => ({
    id: `bench-prod-${idx}`,
    sku: `MRH-BN-${1000 + idx}`,
    barcode: String(8969000000000 + idx),
    name: `Benchmark Retail Item ${idx} Pack`,
    brand: 'Marhaba Benchmark',
    departmentId: 'grocery-pantry',
    departmentName: 'Grocery & Pantry',
    subcategory: 'Pantry',
    supplierId: 'sup-friesland',
    unitLabel: '1kg',
    packConversion: 1,
    purchaseCost: 220 + (idx % 50),
    sellingPrice: 280 + (idx % 50),
    taxClass: 'Standard GST (Demo Configurable)',
    status: 'Active',
    reorderPoint: 10,
    dataTier: 'demonstration',
  }));

  const tLookup0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    const targetBarcode = syntheticProducts[(i * 7) % syntheticProducts.length].barcode;
    const hit = lookupProductByBarcodeOrSku(syntheticProducts, targetBarcode);
    assert.ok(hit);
  }
  const lookupAvgMs = (performance.now() - tLookup0) / 1000;

  const tCatalog0 = performance.now();
  const redacted = syntheticProducts.map((p) => redactProductForRole(p, 'cashier'));
  const filtered = redacted
    .filter((p) => p.name.toLowerCase().includes('benchmark'))
    .sort((a, b) => a.sellingPrice - b.sellingPrice)
    .slice(0, 15);
  const catalogLatencyMs = performance.now() - tCatalog0;
  assert.equal(filtered.length, 15);
  assert.equal(filtered[0].purchaseCost, null);

  let bootstrapLatencyMs = 0;
  await withTestServer(async (baseUrl) => {
    const ceoToken = await loginAs(baseUrl, 'riaz.ceo@marhaba.demo');
    const tBoot0 = performance.now();
    const res = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
      headers: { Authorization: `Bearer ${ceoToken}` },
    });
    await res.json();
    bootstrapLatencyMs = performance.now() - tBoot0;
    assert.equal(res.status, 200);
  });

  console.info(
    `[PERF_BENCHMARK] 260-SKU lookup avg: ${lookupAvgMs.toFixed(4)}ms | 260-SKU redact+filter+sort+page: ${catalogLatencyMs.toFixed(2)}ms | CEO HTTP bootstrap: ${bootstrapLatencyMs.toFixed(2)}ms`
  );
  assert.ok(lookupAvgMs < 2, `Expected fast barcode lookup (<2ms), got ${lookupAvgMs}`);
  assert.ok(catalogLatencyMs < 50, `Expected fast 260-SKU catalog processing (<50ms), got ${catalogLatencyMs}`);
  assert.ok(bootstrapLatencyMs < 250, `Expected fast CEO bootstrap (<250ms), got ${bootstrapLatencyMs}`);
});
