import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { hasPermission } from '../../erp/permissions';
import type { StaffRoleId } from '../../erp/types';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface ReportsSettingsModuleProps {
  mode: 'reports' | 'settings';
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

const AUDIT_PAGE_SIZE = 15;

export function ReportsSettingsModule({
  mode,
  data,
  onRefresh,
}: ReportsSettingsModuleProps) {
  const [tab, setTab] = useState<'approvals' | 'users' | 'rbac' | 'sync' | 'audit'>('approvals');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // User Provisioning Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleId, setNewRoleId] = useState<StaffRoleId>('cashier');
  const [newBranchId, setNewBranchId] = useState('hyderabad');

  // Audit Log filter & pagination
  const [auditOutcomeFilter, setAuditOutcomeFilter] = useState<'All' | 'Success' | 'Denied'>('All');
  const [auditPage, setAuditPage] = useState(1);

  const canExportReports = hasPermission(data.user.roleId, 'reports', 'export');
  const canAdminSettings = hasPermission(data.user.roleId, 'settings', 'administer');

  const roleList = useMemo(
    () => (data.roleDefinitions ? Object.values(data.roleDefinitions) : []),
    [data.roleDefinitions]
  );

  const filteredAuditLogs = useMemo(() => {
    if (auditOutcomeFilter === 'All') return data.auditLogs;
    return data.auditLogs.filter((l) => l.outcome === auditOutcomeFilter);
  }, [data.auditLogs, auditOutcomeFilter]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));
  const safeAuditPage = Math.min(auditPage, totalAuditPages);
  const pagedAuditLogs = filteredAuditLogs.slice(
    (safeAuditPage - 1) * AUDIT_PAGE_SIZE,
    safeAuditPage * AUDIT_PAGE_SIZE
  );

  const exportCsv = (filename: string, rows: string[][]) => {
    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDecision = async (id: string, decision: 'Approved' | 'Rejected') => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.decideApproval(id, decision, `${decision} via Governance Center`);
      setFeedback({ type: 'ok', text: `Request ${id} marked ${decision}.` });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Decision denied.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.provisionStaffUser({
        fullName: newName,
        email: newEmail,
        roleId: newRoleId,
        branchId: newBranchId,
        department: 'Store Operations',
      });
      setNewName('');
      setNewEmail('');
      setFeedback({ type: 'ok', text: 'New staff account provisioned (demo PIN: demo1234).' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Provisioning failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleUserActive = async (id: string, active: boolean) => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.updateStaffUserRole(id, { active: !active });
      setFeedback({
        type: 'ok',
        text: `Staff account ${!active ? 'reactivated' : 'disabled'}.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleChangeUserRole = async (id: string, roleId: StaffRoleId) => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.updateStaffUserRole(id, { roleId });
      setFeedback({
        type: 'ok',
        text: `Staff role reassigned to ${data.roleDefinitions?.[roleId]?.label || roleId}.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Role update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSimulateSyncIssue = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.simulateSyncIssue();
      setFeedback({
        type: 'err',
        text: 'Simulated Website Catalogue Sync timeout. Trigger "Run Sync Check" to recover feed.',
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Simulation denied.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRunSync = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.runWebsiteSync();
      setFeedback({ type: 'ok', text: 'All public storefront synchronization feeds recovered & refreshed.' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Sync failed.' });
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'reports') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#1C1917]">
              Retail Operations &amp; Executive BI Reports
            </h2>
            <p className="text-xs text-[#57534E]">
              Scoped strictly to your role ({data.role.label}) and branch authorization ({data.activeBranchScope}).
            </p>
          </div>
          {canExportReports && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  exportCsv('marhaba-pos-sales-demo.csv', [
                    ['Receipt', 'Branch', 'Cashier', 'Method', 'Status', 'TotalPKR'],
                    ...data.posSales.map((s) => [
                      s.receiptNumber,
                      s.branchId,
                      s.cashierName,
                      s.paymentMethod,
                      s.status,
                      String(s.grandTotal),
                    ]),
                  ])
                }
                className="px-3.5 py-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold hover:border-[#9B1C2E] inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportCsv('marhaba-stock-valuation-demo.csv', [
                    ['Branch', 'ProductId', 'Location', 'OnHand', 'Reserved', 'Damaged', 'Expiry'],
                    ...data.stock.map((st) => [
                      st.branchId,
                      st.productId,
                      st.locationCode,
                      String(st.onHand),
                      String(st.reserved),
                      String(st.damaged),
                      st.expiryDate || 'Non-Perishable',
                    ]),
                  ])
                }
                className="px-3.5 py-2 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Stock CSV</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs text-[#57534E]">POS Sales Volume (Demo)</p>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {formatPKR(data.posSales.reduce((a, b) => a + b.grandTotal, 0))}
            </p>
            <p className="mt-1 text-[11px] text-[#57534E]">
              {data.posSales.length} counter transactions
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs text-[#57534E]">Online Orders Intake</p>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {formatPKR(data.onlineOrders.reduce((a, b) => a + b.totalAmount, 0))}
            </p>
            <p className="mt-1 text-[11px] text-[#57534E]">
              {data.onlineOrders.length} storefront orders
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs text-[#57534E]">Governance Requests Logged</p>
            <p className="mt-2 text-xl font-bold tabular-nums">{data.approvals.length}</p>
            <p className="mt-1 text-[11px] text-[#57534E]">
              {data.approvals.filter((a) => a.status === 'Pending').length} awaiting independent approval
            </p>
          </div>
        </div>

        {/* Margin & Slow-Moving Intelligence (Redacted for unauthorized roles) */}
        {data.role.canViewCostAndMargin ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#9B1C2E]" />
                  <span>Department Margin Contribution</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Department</th>
                      <th className="py-2.5 px-4 font-semibold text-right">POS Revenue</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Est. COGS</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]">
                    {data.departmentMargins.map((dm) => (
                      <tr key={dm.departmentId} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4 font-semibold text-[#1C1917]">
                          {dm.departmentName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {formatPKR(dm.revenue)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                          {formatPKR(dm.cogs)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#166534]">
                          {dm.marginPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {data.departmentMargins.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#57534E]">
                          No POS sales captured in active scope yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA]">
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Slow-Moving / Zero-Sale Stock Holding ({data.slowMovingSkus.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">SKU &amp; Product</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Units Held</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cost Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]">
                    {data.slowMovingSkus.slice(0, 8).map((sk) => (
                      <tr key={sk.productId} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#1C1917]">{sk.name}</p>
                          <p className="text-[10px] font-mono text-[#57534E]">
                            {sk.sku} · {sk.departmentName}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{sk.stockUnits}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          {formatPKR(sk.stockCostValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 flex items-center gap-3 text-xs text-[#57534E]">
            <Lock className="w-4 h-4 text-[#9B1C2E] shrink-0" />
            <span>
              Department COGS, gross margin percentages, and cost-valued slow-moving SKU breakdowns are server-redacted for role <strong>{data.role.label}</strong>.
            </span>
          </div>
        )}

        {/* Cycle Count Variance Report */}
        {data.cycleCounts.length > 0 && (
          <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E2DA]">
              <h3 className="text-sm font-bold text-[#1C1917]">
                Cycle Count Variance Summary ({data.cycleCounts.length})
              </h3>
            </div>
            <div className="divide-y divide-[#E6E2DA]">
              {data.cycleCounts.map((cnt) => (
                <div
                  key={cnt.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#1C1917]">{cnt.productName}</span>
                    <span className="text-[#57534E]">
                      {' '}
                      · {cnt.branchId} · System {cnt.systemQty} vs Physical {cnt.physicalQty}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#9B1C2E]">
                    {cnt.variance > 0 ? `+${cnt.variance}` : cnt.variance} ({cnt.status})
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-2 flex flex-wrap gap-1.5">
        {(
          [
            ['approvals', `Approvals Queue (${data.approvals.filter((a) => a.status === 'Pending').length})`],
            ['sync', 'Website Sync Health'],
            ...(data.staffUsers.length > 0 ? [['users', `Staff Accounts (${data.staffUsers.length})`]] : []),
            ...(data.roleDefinitions ? [['rbac', `RBAC Matrix (${roleList.length} Roles)`]] : []),
            ...(data.auditLogs.length > 0 ? [['audit', `Audit Log (${data.auditLogs.length})`]] : []),
          ] as [typeof tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === id ? 'bg-[#9B1C2E] text-white' : 'text-[#57534E] hover:bg-[#FAF9F6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-[#166534]/8 border-[#166534]/25 text-[#166534]'
              : 'bg-[#9B1C2E]/8 border-[#9B1C2E]/25 text-[#9B1C2E]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {tab === 'approvals' && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9B1C2E]" />
                <span>Unified Governance &amp; Approvals Queue</span>
              </h2>
              <p className="text-xs text-[#57534E]">
                Segregation of Duties enforced by server: requesters cannot approve or reject their own submissions.
              </p>
            </div>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.approvals.map((apr) => (
              <div
                key={apr.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E6E2DA] font-mono text-[10px] font-semibold">
                      {apr.type}
                    </span>
                    <span className="font-bold text-[#1C1917]">{apr.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        apr.status === 'Approved'
                          ? 'bg-[#166534]/10 text-[#166534]'
                          : apr.status === 'Rejected'
                          ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                          : 'bg-[#B45309]/10 text-[#B45309]'
                      }`}
                    >
                      {apr.status}
                    </span>
                  </div>
                  <p className="text-[#57534E]">
                    Requested by <strong>{apr.requestedByName}</strong> · Branch: {apr.branchId} ·{' '}
                    {apr.previousValue} &rarr; <strong>{apr.proposedValue}</strong>
                  </p>
                  <p className="text-[#57534E]">{apr.justification}</p>
                  {!apr.authority.allowed && apr.status === 'Pending' && (
                    <p className="text-[11px] font-medium text-[#B45309] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{apr.authority.reason}</span>
                    </p>
                  )}
                </div>

                {apr.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busy || !apr.authority.allowed}
                      onClick={() => handleDecision(apr.id, 'Approved')}
                      className="px-3.5 py-2 rounded-lg bg-[#166534] text-white font-semibold disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy || !apr.authority.allowed}
                      onClick={() => handleDecision(apr.id, 'Rejected')}
                      className="px-3.5 py-2 rounded-lg border border-[#9B1C2E] text-[#9B1C2E] font-semibold disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'sync' && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#166534]" />
                <span>Public Website &amp; Management Synchronization Health</span>
              </h3>
              <p className="text-xs text-[#57534E]">
                Authoritative product SKUs, branch sellable availability, and customer checkout order intake.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canAdminSettings && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSimulateSyncIssue}
                  className="px-3 py-2 rounded-lg border border-[#B45309]/40 bg-[#B45309]/8 text-[#B45309] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate Sync Alert</span>
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={handleRunSync}
                className="px-3.5 py-2 rounded-lg bg-[#1C1917] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Sync Check</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.syncJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#1C1917]">{job.channel}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      job.status === 'Healthy'
                        ? 'bg-[#166534]/10 text-[#166534]'
                        : 'bg-[#B45309]/15 text-[#B45309]'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-[#57534E]">{job.detail}</p>
                <p className="font-mono text-[11px] text-[#57534E]">
                  Records: {job.recordsSynced} · Last: {job.lastRunAt.slice(0, 19).replace('T', ' ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'users' && (
        <div className="space-y-5">
          {canAdminSettings && (
            <form
              onSubmit={handleCreateUser}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#9B1C2E]" />
                <span>Provision Staff Account (MIS / CEO Only)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@marhaba.demo"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value as StaffRoleId)}
                  className="h-10 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {roleList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="h-10 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold"
              >
                Create Staff Account
              </button>
            </form>
          )}

          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Code &amp; Name</th>
                    <th className="py-2.5 px-4 font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-semibold">Assigned Role</th>
                    <th className="py-2.5 px-4 font-semibold">Branch</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2DA]">
                  {data.staffUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-2.5 px-4">
                        <p className="font-bold text-[#1C1917]">{u.fullName}</p>
                        <p className="font-mono text-[10px] text-[#57534E]">{u.employeeCode}</p>
                      </td>
                      <td className="py-2.5 px-4 text-[#57534E]">{u.email}</td>
                      <td className="py-2.5 px-4 font-semibold">
                        {canAdminSettings && u.id !== data.user.id && roleList.length > 0 ? (
                          <select
                            value={u.roleId}
                            disabled={busy}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value as StaffRoleId)}
                            aria-label={`Role for ${u.fullName}`}
                            className="h-8 px-2 rounded border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-medium"
                          >
                            {roleList.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{data.roleDefinitions?.[u.roleId]?.label || u.roleId}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{u.branchId}</td>
                      <td className="py-2.5 px-4 text-right">
                        {canAdminSettings && u.id !== data.user.id ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggleUserActive(u.id, u.active)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              u.active
                                ? 'bg-[#166534]/10 text-[#166534]'
                                : 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                            }`}
                          >
                            {u.active ? 'Active' : 'Disabled'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold">
                            {u.active ? 'Active' : 'Disabled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'rbac' && data.roleDefinitions && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA]">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Server-Enforced RBAC Permission Matrix ({roleList.length} Roles)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Role</th>
                  <th className="py-2.5 px-4 font-semibold">Tier</th>
                  <th className="py-2.5 px-4 font-semibold">Cost/Margin</th>
                  <th className="py-2.5 px-4 font-semibold">POS Disc Cap</th>
                  <th className="py-2.5 px-4 font-semibold">Approval Ceiling</th>
                  <th className="py-2.5 px-4 font-semibold">Permitted Modules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {roleList.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-bold text-[#1C1917]">
                      {r.label}
                      {r.isReadOnlyAudit && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#B45309]/10 text-[#B45309] text-[10px]">
                          Read-Only Audit
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-[#57534E]">{r.tier}</td>
                    <td className="py-2.5 px-4">
                      {r.canViewCostAndMargin ? 'Visible' : 'Redacted'}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{r.maxPosDiscountPercent}%</td>
                    <td className="py-2.5 px-4 font-mono">
                      {r.approvalLimitPkr > 100000000
                        ? 'Unlimited'
                        : formatPKR(r.approvalLimitPkr)}
                    </td>
                    <td className="py-2.5 px-4 text-[#57534E]">
                      {Object.keys(r.modules).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#9B1C2E]" />
              <span>Immutable Security &amp; Operations Audit Log ({filteredAuditLogs.length})</span>
            </h3>
            <div className="flex items-center gap-1.5">
              {(['All', 'Success', 'Denied'] as const).map((out) => (
                <button
                  key={out}
                  type="button"
                  onClick={() => {
                    setAuditOutcomeFilter(out);
                    setAuditPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    auditOutcomeFilter === out
                      ? 'border-[#9B1C2E] bg-[#9B1C2E]/8 text-[#9B1C2E]'
                      : 'border-[#E6E2DA] text-[#57534E]'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Actor</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Outcome</th>
                  <th className="py-2.5 px-4 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {pagedAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#57534E] whitespace-nowrap">
                      {log.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#1C1917]">
                      {log.actorName}
                      <p className="text-[10px] font-normal text-[#57534E]">{log.actorRole}</p>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">{log.action}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.outcome === 'Success'
                            ? 'bg-[#166534]/10 text-[#166534]'
                            : 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#57534E]">{log.detail}</td>
                  </tr>
                ))}
                {pagedAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#57534E]">
                      No audit events match the selected outcome filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredAuditLogs.length > AUDIT_PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#57534E]">
              <span>
                Showing {(safeAuditPage - 1) * AUDIT_PAGE_SIZE + 1}–
                {Math.min(safeAuditPage * AUDIT_PAGE_SIZE, filteredAuditLogs.length)} of{' '}
                {filteredAuditLogs.length} audit events
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeAuditPage <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono">
                  {safeAuditPage}/{totalAuditPages}
                </span>
                <button
                  type="button"
                  disabled={safeAuditPage >= totalAuditPages}
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
