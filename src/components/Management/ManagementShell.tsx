import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgePercent,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type { ManagementModuleId } from '../../erp/types';
import type { ManagementBootstrapPayload } from './managementApi';

interface ManagementShellProps {
  data: ManagementBootstrapPayload;
  activeModule: ManagementModuleId;
  selectedBranch: string;
  onSelectBranch: (branchId: string) => void;
  onSelectModule: (moduleId: ManagementModuleId) => void;
  onLogout: () => void;
  onExitToPublic: () => void;
  children: React.ReactNode;
}

const MODULE_ICONS: Record<ManagementModuleId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  pos: Receipt,
  products: Package,
  inventory: ClipboardCheck,
  purchasing: Truck,
  orders: ShoppingCart,
  offers: BadgePercent,
  finance: CreditCard,
  staff: Users,
  branches: Building2,
  customers: Headphones,
  reports: BarChart3,
  settings: Settings,
};

export function ManagementShell({
  data,
  activeModule,
  selectedBranch,
  onSelectBranch,
  onSelectModule,
  onLogout,
  onExitToPublic,
  children,
}: ManagementShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const currentModuleMeta =
    data.permittedModules.find((m) => m.id === activeModule) || data.permittedModules[0];

  const isBranchLocked = data.role.branchRestricted || data.user.branchId !== 'all';
  const highPriorityCount = data.priorityAlerts.filter((a) => a.priority === 'high').length;

  const getDisplayLabel = (mod: ManagementBootstrapPayload['permittedModules'][number]) => {
    if (data.user.roleId === 'cashier' || data.user.roleId === 'senior_cashier') {
      if (mod.id === 'products') return 'Product Lookup';
      if (mod.id === 'staff') return 'My Shift & Leave';
    }
    return mod.label;
  };

  const renderSidebarNav = (compact: boolean, onAfterClick?: () => void) => (
    <nav aria-label="Management Modules" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
      {data.permittedModules.map((mod) => {
        const Icon = MODULE_ICONS[mod.id] || LayoutDashboard;
        const active = activeModule === mod.id;
        const displayLabel = getDisplayLabel(mod);
        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => {
              onSelectModule(mod.id);
              onAfterClick?.();
            }}
            title={compact ? displayLabel : undefined}
            aria-current={active ? 'page' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold transition-colors ${
              active
                ? 'bg-[#9B1C2E] text-white'
                : 'text-[#1C1917] hover:bg-[#F3F1EC] hover:text-[#9B1C2E]'
            } ${compact ? 'justify-center px-2' : ''}`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#57534E]'}`} />
            {!compact && <span className="truncate">{displayLabel}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#FFFFFF] border-r border-[#E6E2DA] sticky top-0 h-screen transition-all duration-150 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
      >
        <div className="h-16 px-3.5 border-b border-[#E6E2DA] flex items-center justify-between gap-2 shrink-0">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-serif text-base font-bold text-[#1C1917] truncate">Marhaba ERP</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9B1C2E] truncate">
                MWI Retail Suite (Demo)
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-lg text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917] shrink-0 mx-auto"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {renderSidebarNav(sidebarCollapsed)}

        <div className="p-3 border-t border-[#E6E2DA] space-y-2 shrink-0">
          {!sidebarCollapsed && (
            <div className="px-2 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA]">
              <p className="text-xs font-bold text-[#1C1917] truncate">{data.user.fullName}</p>
              <p className="text-[11px] text-[#57534E] truncate">{data.role.label}</p>
              <p className="text-[10px] font-mono text-[#57534E] mt-0.5">{data.user.employeeCode}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onExitToPublic}
            title={sidebarCollapsed ? 'Public Website' : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#E6E2DA] text-xs font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Public Website</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#1C1917]/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 bg-[#FFFFFF] h-full flex flex-col border-r border-[#E6E2DA]">
            <div className="h-16 px-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <div>
                <p className="font-serif text-base font-bold text-[#1C1917]">Marhaba ERP</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  {data.role.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation"
                className="p-2 rounded-lg hover:bg-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarNav(false, () => setMobileDrawerOpen(false))}
            <div className="p-3 border-t border-[#E6E2DA] space-y-2">
              <button
                type="button"
                onClick={onExitToPublic}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#E6E2DA] text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Website</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E6E2DA] px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open management menu"
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-[#F3F1EC]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-[#57534E]">
                <span className="hidden sm:inline">Marhaba Supermarket Management</span>
                <span className="hidden sm:inline">/</span>
                <span className="font-semibold text-[#9B1C2E] truncate">
                  {currentModuleMeta?.shortLabel || 'Overview'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#1C1917] truncate">
                <span className="sm:hidden">{currentModuleMeta?.shortLabel || 'Overview'}</span>
                <span className="hidden sm:inline">
                  {currentModuleMeta ? getDisplayLabel(currentModuleMeta) : 'Today'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Branch Scope Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="mgmt-branch-scope" className="sr-only">
                Active Branch Scope
              </label>
              <select
                id="mgmt-branch-scope"
                disabled={isBranchLocked}
                value={isBranchLocked ? data.activeBranchScope : selectedBranch}
                onChange={(e) => onSelectBranch(e.target.value)}
                title={
                  isBranchLocked
                    ? `Branch locked by RBAC (${data.activeBranchScope})`
                    : 'Filter operations by branch'
                }
                className="h-9 px-2 sm:px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] disabled:opacity-80 max-w-[136px] sm:max-w-[200px]"
              >
                {!isBranchLocked && <option value="all">All Branches</option>}
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Alerts Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAlertsOpen((o) => !o)}
                aria-label={`Priority alerts (${data.priorityAlerts.length})`}
                className="relative h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] hover:border-[#9B1C2E] inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <Bell className="w-4 h-4 text-[#57534E]" />
                {data.priorityAlerts.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                      highPriorityCount > 0
                        ? 'bg-[#9B1C2E] text-white'
                        : 'bg-[#1C1917] text-white'
                    }`}
                  >
                    {data.priorityAlerts.length}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E6E2DA] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917]">
                      Operational Exceptions ({data.priorityAlerts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlertsOpen(false)}
                      className="text-xs text-[#57534E] hover:text-[#1C1917]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E6E2DA]">
                    {data.priorityAlerts.length === 0 ? (
                      <p className="p-4 text-xs text-[#57534E]">No active operational alerts.</p>
                    ) : (
                      data.priorityAlerts.map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => {
                            setAlertsOpen(false);
                            onSelectModule(al.module);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#1C1917]">{al.title}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                al.priority === 'high'
                                  ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                                  : 'bg-[#B45309]/10 text-[#B45309]'
                              }`}
                            >
                              {al.priority}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#57534E]">{al.detail}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="h-9 px-3 rounded-lg border border-[#E6E2DA] text-xs font-semibold text-[#1C1917] hover:bg-[#F3F1EC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 text-[#57534E]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Sub-bar Demo Governance Transparency Strip */}
        <div className="bg-[#F3F1EC]/70 border-b border-[#E6E2DA] px-4 lg:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#57534E]">
          <span>
            Signed in as <strong className="text-[#1C1917]">{data.user.fullName}</strong> ({data.role.label})
            {' · '}
            Cost/Margin Access:{' '}
            <strong className="text-[#1C1917]">
              {data.role.canViewCostAndMargin ? 'Authorized' : 'Redacted by RBAC'}
            </strong>
            {data.role.isReadOnlyAudit && (
              <>
                {' · '}
                <strong className="text-[#9B1C2E]">Read-Only Audit Lock Active</strong>
              </>
            )}
          </span>
          <span className="font-medium">
            Proposed MWI Solution (Safe Demo Environment · Retail Supermarket Only)
          </span>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
