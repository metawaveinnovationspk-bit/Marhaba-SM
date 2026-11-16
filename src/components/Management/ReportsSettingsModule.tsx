import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
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

  const canExportReports = hasPermission(data.user.roleId, 'reports', 'export');
  const canAdminSettings = hasPermission(data.user.roleId, 'settings', 'administer');

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
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRunSync = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.runWebsiteSync();
      setFeedback({ type: 'ok', text: 'All public storefront synchronization feeds refreshed.' });
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
            ...(data.roleDefinitions ? [['rbac', 'RBAC Matrix (18 Roles)']] : []),
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#166534]" />
                <span>Public Website &amp; Management Synchronization Health</span>
              </h3>
              <p className="text-xs text-[#57534E]">
                Authoritative product SKUs, branch sellable availability, and customer checkout order intake.
              </p>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.syncJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917]">{job.channel}</span>
                  <span className="px-2 py-0.5 rounded bg-[#166534]/10 text-[#166534] text-[10px] font-semibold">
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
                  {data.roleDefinitions &&
                    Object.values(data.roleDefinitions).map((r) => (
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
                    <th className="py-2.5 px-4 font-semibold">Role</th>
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
                        {data.roleDefinitions?.[u.roleId]?.label || u.roleId}
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
              Server-Enforced RBAC Permission Matrix (18 Roles)
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
                {Object.values(data.roleDefinitions).map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-bold text-[#1C1917]">{r.label}</td>
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
          <div className="px-5 py-4 border-b border-[#E6E2DA]">
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#9B1C2E]" />
              <span>Immutable Security &amp; Operations Audit Log</span>
            </h3>
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
                {data.auditLogs.map((log) => (
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
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
