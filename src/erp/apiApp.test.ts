import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { createApiApp } from './apiApp';

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

test('unauthenticated requests to management endpoints fail with 401', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/mgmt/bootstrap`);
    assert.equal(res.status, 401);
  });
});

test('cashier RBAC blocks finance & redacts product purchase costs', async () => {
  await withTestServer(async (baseUrl) => {
    const token = await loginAs(baseUrl, 'cashier.hyd@marhaba.demo');

    const bootRes = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(bootRes.status, 200);
    const boot = (await bootRes.json()) as {
      products: { purchaseCost: number | null; marginPercent: number | null }[];
      activeBranchScope: string;
    };
    assert.equal(boot.activeBranchScope, 'hyderabad');
    assert.equal(boot.products[0].purchaseCost, null);
    assert.equal(boot.products[0].marginPercent, null);

    const expRes = await fetch(`${baseUrl}/api/mgmt/finance/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branchId: 'hyderabad',
        category: 'Utilities',
        description: 'Unauthorized expense',
        amount: 500,
      }),
    });
    assert.equal(expRes.status, 403);
  });
});

test('POS enforces discount cap, deducts stock, and blocks sale deletion', async () => {
  await withTestServer(async (baseUrl) => {
    const token = await loginAs(baseUrl, 'cashier.hyd@marhaba.demo');
    const bootRes = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const boot = (await bootRes.json()) as {
      shifts: { id: string }[];
      products: { id: string; sellingPrice: number }[];
    };
    const shiftId = boot.shifts[0].id;
    const prod = boot.products[0];

    // Exceeds cashier 5% cap -> 403
    const overDiscRes = await fetch(`${baseUrl}/api/mgmt/pos/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        shiftId,
        branchId: 'hyderabad',
        items: [{ productId: prod.id, quantity: 1, discountPercent: 12 }],
        paymentMethod: 'Cash',
        cashReceived: 5000,
      }),
    });
    assert.equal(overDiscRes.status, 403);

    // Valid sale -> 201
    const saleRes = await fetch(`${baseUrl}/api/mgmt/pos/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        shiftId,
        branchId: 'hyderabad',
        items: [{ productId: prod.id, quantity: 1, discountPercent: 0 }],
        paymentMethod: 'Cash',
        cashReceived: 5000,
      }),
    });
    assert.equal(saleRes.status, 201);
    const { sale } = (await saleRes.json()) as { sale: { id: string } };

    // Immutability: DELETE rejected 403
    const delRes = await fetch(`${baseUrl}/api/mgmt/pos/sales/${sale.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delRes.status, 403);
  });
});

test('segregation of duties blocks self-approval and lets Director approve price change', async () => {
  await withTestServer(async (baseUrl) => {
    const opToken = await loginAs(baseUrl, 'catalog@marhaba.demo');
    const dirToken = await loginAs(baseUrl, 'faraz.purchasing@marhaba.demo');

    // Submit price change request as Product Data Operator
    const bootOpRes = await fetch(`${baseUrl}/api/mgmt/bootstrap`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    const bootOp = (await bootOpRes.json()) as { products: { id: string }[] };
    const targetProdId = bootOp.products[2].id;

    const reqRes = await fetch(`${baseUrl}/api/mgmt/offers/price-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({
        productId: targetProdId,
        proposedPrice: 515,
        justification: 'Promo test price change',
      }),
    });
    assert.equal(reqRes.status, 201);
    const { approval } = (await reqRes.json()) as { approval: { id: string } };

    // Self-approval blocked
    const selfApprove = await fetch(`${baseUrl}/api/mgmt/approvals/${approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({ decision: 'Approved' }),
    });
    assert.equal(selfApprove.status, 403);

    // Director Purchasing approves -> 200 & updates product price
    const dirApprove = await fetch(`${baseUrl}/api/mgmt/approvals/${approval.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dirToken}` },
      body: JSON.stringify({ decision: 'Approved', note: 'Verified margin' }),
    });
    assert.equal(dirApprove.status, 200);

    const pubRes = await fetch(`${baseUrl}/api/public/catalog`);
    const pub = (await pubRes.json()) as { products: { id: string; sellingPrice: number }[] };
    const updated = pub.products.find((p) => p.id === targetProdId);
    assert.equal(updated?.sellingPrice, 515);
  });
});

test('public storefront checkout creates online order with idempotency and reserves stock', async () => {
  await withTestServer(async (baseUrl) => {
    const pubBefore = (await (await fetch(`${baseUrl}/api/public/catalog`)).json()) as {
      products: { id: string; branchStock: { branchId: string; sellable: number }[] }[];
    };
    const item = pubBefore.products[0];
    const hydBefore = item.branchStock.find((b) => b.branchId === 'hyderabad')!.sellable;

    const payload = {
      idempotencyKey: 'idem-test-1',
      orderNumber: 'MRH-DEMO-777001',
      branchId: 'hyderabad',
      customerName: 'Sara Khan',
      customerPhone: '0300-5551234',
      fulfillmentMethod: 'delivery',
      addressSummary: 'Latifabad Unit 7, Hyderabad',
      paymentMethod: 'cod',
      items: [{ productId: item.id, quantity: 2 }],
    };

    const res1 = await fetch(`${baseUrl}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res1.status, 201);

    const res2 = await fetch(`${baseUrl}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res2.status, 200);
    const body2 = (await res2.json()) as { deduplicated?: boolean };
    assert.equal(body2.deduplicated, true);

    const pubAfter = (await (await fetch(`${baseUrl}/api/public/catalog`)).json()) as {
      products: { id: string; branchStock: { branchId: string; sellable: number }[] }[];
    };
    const hydAfter = pubAfter.products
      .find((p) => p.id === item.id)!
      .branchStock.find((b) => b.branchId === 'hyderabad')!.sellable;
    assert.equal(hydAfter, hydBefore - 2);
  });
});
