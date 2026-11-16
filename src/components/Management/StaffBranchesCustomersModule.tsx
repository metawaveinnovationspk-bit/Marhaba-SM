import React, { useState } from 'react';
import { Building2, CheckCircle2, Headphones, Users } from 'lucide-react';
import { hasPermission } from '../../erp/permissions';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface StaffBranchesCustomersModuleProps {
  mode: 'staff' | 'branches' | 'customers';
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

export function StaffBranchesCustomersModule({
  mode,
  data,
  onRefresh,
}: StaffBranchesCustomersModuleProps) {
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Leave Request Form
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveDate, setLeaveDate] = useState('2026-11-26');
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');

  // Customer Case Form
  const [caseCustomer, setCaseCustomer] = useState('');
  const [casePhone, setCasePhone] = useState('');
  const [caseOrderNo, setCaseOrderNo] = useState('');
  const [caseCategory, setCaseCategory] = useState('Return & Exchange');
  const [caseNotes, setCaseNotes] = useState('');
  const [refundInputs, setRefundInputs] = useState<Record<string, string>>({});

  const canApproveLeave = hasPermission(data.user.roleId, 'staff', 'approve');
  const canEditChecklist = hasPermission(data.user.roleId, 'branches', 'edit');
  const canCreateCase = hasPermission(data.user.roleId, 'customers', 'create');
  const canEditCase = hasPermission(data.user.roleId, 'customers', 'edit');

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.submitLeave({
        leaveType,
        startDate: leaveDate,
        days: Number(leaveDays),
        reason: leaveReason,
      });
      setLeaveReason('');
      setFeedback({ type: 'ok', text: 'Leave request submitted for supervisor/HR review.' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Leave request failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDecideLeave = async (id: string, status: 'Approved' | 'Rejected') => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.decideLeave(id, status);
      setFeedback({ type: 'ok', text: `Leave request marked ${status}.` });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Action denied.' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleChecklist = async (id: string) => {
    setBusy(true);
    try {
      await managementApi.toggleChecklist(id);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.createCustomerCase({
        customerName: caseCustomer,
        maskedPhone: casePhone,
        branchId: data.activeBranchScope === 'all' ? 'hyderabad' : data.activeBranchScope,
        orderNumber: caseOrderNo,
        category: caseCategory,
        priority: 'Normal',
        notes: caseNotes,
      });
      setCaseCustomer('');
      setCasePhone('');
      setCaseOrderNo('');
      setCaseNotes('');
      setFeedback({ type: 'ok', text: 'Customer support case logged.' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Case creation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRequestRefund = async (caseId: string) => {
    const amount = Number(refundInputs[caseId] || 0);
    if (amount <= 0) return;
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.updateCustomerCase(caseId, {
        status: 'In Review',
        requestRefundAmount: amount,
      });
      setFeedback({
        type: 'ok',
        text: `Refund request (PKR ${amount.toLocaleString()}) submitted to Finance Approvals (segregated from Customer Care).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Refund request failed.' });
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'branches') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.branches.map((br) => (
            <div key={br.id} className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#1C1917]">{br.shortName}</h2>
                <Building2 className="w-4 h-4 text-[#9B1C2E]" />
              </div>
              <p className="mt-1 text-xs text-[#57534E]">{br.address}</p>
              <p className="mt-2 text-[11px] font-medium text-[#166534]">{br.hours}</p>
              <p className="mt-1 text-[11px] text-[#57534E]">
                Supermarket Operations Scope Only
              </p>
            </div>
          ))}
        </div>

        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA]">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Opening &amp; Closing Compliance Checklists
            </h3>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.checklists.map((chk) => (
              <div key={chk.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E6E2DA] text-[10px] font-semibold mr-2">
                    {chk.branchId} · {chk.shiftType}
                  </span>
                  <span className={chk.completed ? 'line-through text-[#57534E]' : 'font-semibold text-[#1C1917]'}>
                    {chk.task}
                  </span>
                  {chk.completedBy && (
                    <p className="mt-1 text-[11px] text-[#166534]">
                      Verified by {chk.completedBy}
                    </p>
                  )}
                </div>
                {canEditChecklist && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleChecklist(chk.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                      chk.completed
                        ? 'bg-[#166534]/10 text-[#166534]'
                        : 'bg-[#1C1917] text-white'
                    }`}
                  >
                    {chk.completed ? 'Completed' : 'Mark Done'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (mode === 'customers') {
    return (
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium ${
              feedback.type === 'ok'
                ? 'bg-[#166534]/8 border-[#166534]/25 text-[#166534]'
                : 'bg-[#9B1C2E]/8 border-[#9B1C2E]/25 text-[#9B1C2E]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#9B1C2E]" />
                <span>Customer Care &amp; Return Intake ({data.customerCases.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-[#E6E2DA]">
              {data.customerCases.map((c) => (
                <div key={c.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#1C1917]">
                      {c.caseNumber} · {c.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E6E2DA] font-semibold">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[#57534E]">
                    {c.category} · {c.branchId} · {c.maskedPhone}
                    {c.orderNumber ? ` · Order: ${c.orderNumber}` : ''}
                  </p>
                  <p className="text-[#1C1917]">{c.notes}</p>
                  {canEditCase && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        value={refundInputs[c.id] || ''}
                        onChange={(e) =>
                          setRefundInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Refund PKR"
                        className="w-32 h-8 px-2.5 rounded border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRequestRefund(c.id)}
                        className="h-8 px-3 rounded bg-[#9B1C2E] text-white text-xs font-semibold"
                      >
                        Request Finance Refund
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {canCreateCase && (
            <section className="lg:col-span-5">
              <form
                onSubmit={handleCreateCase}
                className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#1C1917]">Log Customer Case</h3>
                <input
                  type="text"
                  required
                  value={caseCustomer}
                  onChange={(e) => setCaseCustomer(e.target.value)}
                  placeholder="Customer full name"
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={casePhone}
                    onChange={(e) => setCasePhone(e.target.value)}
                    placeholder="Phone (masked)"
                    className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                  />
                  <input
                    type="text"
                    value={caseOrderNo}
                    onChange={(e) => setCaseOrderNo(e.target.value)}
                    placeholder="Order / Receipt #"
                    className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                  />
                </div>
                <select
                  value={caseCategory}
                  onChange={(e) => setCaseCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  <option value="Return & Exchange">Return &amp; Exchange</option>
                  <option value="Order Assistance">Order Assistance</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Complaint">Complaint</option>
                </select>
                <textarea
                  rows={3}
                  required
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  placeholder="Case summary..."
                  className="w-full p-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-10 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold"
                >
                  Create Support Ticket
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#9B1C2E]" />
          <span className="font-bold text-[#1C1917]">Workforce &amp; Shift Roster</span>
          <span className="text-[#57534E]">
            · Group milestone: ~145 team members (published corporate overview; sample operational records below marked DEMO)
          </span>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA]">
            <h2 className="text-sm font-bold text-[#1C1917]">
              {canApproveLeave ? 'Branch Attendance Schedule' : 'My Shift Schedule'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Employee</th>
                  <th className="py-2.5 px-4 font-semibold">Department</th>
                  <th className="py-2.5 px-4 font-semibold">Shift Window</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {data.attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-semibold text-[#1C1917]">
                      {att.fullName}
                      <p className="text-[10px] font-mono text-[#57534E]">{att.employeeCode}</p>
                    </td>
                    <td className="py-2.5 px-4 text-[#57534E]">{att.roleLabel}</td>
                    <td className="py-2.5 px-4 font-mono text-[#57534E]">{att.shiftWindow}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#166534]/10 text-[#166534] font-semibold">
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSubmitLeave}
            className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#1C1917]">Submit Leave Request</h3>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                <option value="Casual">Casual</option>
                <option value="Annual">Annual</option>
                <option value="Medical">Medical</option>
              </select>
              <input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              />
              <input
                type="number"
                min={1}
                max={30}
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
              />
            </div>
            <input
              type="text"
              required
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason for leave"
              className="w-full h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full h-9 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold"
            >
              Submit Leave Application
            </button>
          </form>

          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E6E2DA]">
              <h3 className="text-xs font-bold text-[#1C1917]">Leave Requests</h3>
            </div>
            <div className="divide-y divide-[#E6E2DA]">
              {data.leaveRequests.map((lv) => (
                <div key={lv.id} className="p-3.5 text-xs flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#1C1917]">
                      {lv.employeeName} · {lv.leaveType} ({lv.days}d)
                    </p>
                    <p className="text-[11px] text-[#57534E]">
                      From {lv.startDate} · {lv.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lv.status === 'Pending' && canApproveLeave && lv.userId !== data.user.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecideLeave(lv.id, 'Approved')}
                          className="px-2.5 py-1 rounded bg-[#166534] text-white font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecideLeave(lv.id, 'Rejected')}
                          className="px-2.5 py-1 rounded border border-[#9B1C2E] text-[#9B1C2E] font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E6E2DA] font-semibold">
                        {lv.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
