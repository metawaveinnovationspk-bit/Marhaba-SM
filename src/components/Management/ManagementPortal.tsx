import React, { useCallback, useEffect, useState } from 'react';
import type { ManagementModuleId } from '../../erp/types';
import { useStore } from '../../context/StoreContext';
import { CatalogOffersModule } from './CatalogOffersModule';
import { FinanceModule } from './FinanceModule';
import { InventoryPurchasingModule } from './InventoryPurchasingModule';
import {
  managementApi,
  type ManagementBootstrapPayload,
} from './managementApi';
import { ManagementDashboard } from './ManagementDashboard';
import { ManagementLogin } from './ManagementLogin';
import { ManagementShell } from './ManagementShell';
import { OrdersModule } from './OrdersModule';
import { PosModule } from './PosModule';
import { ReportsSettingsModule } from './ReportsSettingsModule';
import { StaffBranchesCustomersModule } from './StaffBranchesCustomersModule';

const VALID_MODULES: ManagementModuleId[] = [
  'dashboard',
  'pos',
  'products',
  'inventory',
  'purchasing',
  'orders',
  'offers',
  'finance',
  'staff',
  'branches',
  'customers',
  'reports',
  'settings',
];

function extractModuleFromPath(path: string | null): ManagementModuleId {
  if (!path) return 'dashboard';
  const slug = path.replace(/^\/management\/?/, '').split('/')[0] as ManagementModuleId;
  return VALID_MODULES.includes(slug) ? slug : 'dashboard';
}

export default function ManagementPortal() {
  const { managementPath, navigateToManagement, exitManagement } = useStore();
  const [data, setData] = useState<ManagementBootstrapPayload | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeModule, setActiveModule] = useState<ManagementModuleId>(() =>
    extractModuleFromPath(managementPath)
  );

  const [deniedModule, setDeniedModule] = useState<ManagementModuleId | null>(null);

  const loadBootstrap = useCallback(async (branchScope = 'all') => {
    try {
      const payload = await managementApi.bootstrap(branchScope);
      setData(payload);
      const fromUrl = extractModuleFromPath(window.location.pathname);
      const permitted = payload.permittedModules.some((m) => m.id === fromUrl);
      if (window.location.pathname.startsWith('/management/') && !window.location.pathname.endsWith('/login') && fromUrl && !permitted) {
        setDeniedModule(fromUrl);
      } else {
        setDeniedModule(null);
        setActiveModule((prev) => {
          const preferred = window.location.pathname === '/management' ? prev : fromUrl;
          return payload.permittedModules.some((m) => m.id === preferred) ? preferred : 'dashboard';
        });
      }
      return true;
    } catch {
      setData(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCheckingAuth(true);
      try {
        const st = await managementApi.status();
        if (st.authenticated) {
          await loadBootstrap(selectedBranch);
        } else if (mounted) {
          setData(null);
        }
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadBootstrap, selectedBranch]);

  useEffect(() => {
    if (!data) return;
    const slug = extractModuleFromPath(managementPath);
    if (managementPath && managementPath.startsWith('/management/') && !managementPath.endsWith('/login')) {
      if (data.permittedModules.some((m) => m.id === slug)) {
        setDeniedModule(null);
        setActiveModule(slug);
      } else {
        setDeniedModule(slug);
      }
    }
  }, [managementPath, data]);

  const handleSelectModule = (moduleId: ManagementModuleId) => {
    setDeniedModule(null);
    setActiveModule(moduleId);
    navigateToManagement(`/management/${moduleId}`);
  };

  const handleLogout = async () => {
    await managementApi.logout();
    setData(null);
    setDeniedModule(null);
    navigateToManagement('/management/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl px-6 py-5 text-sm font-medium text-[#1C1917]">
          Verifying staff session...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <ManagementLogin
        onSuccess={() => {
          void loadBootstrap('all').then(() => {
            navigateToManagement('/management/dashboard');
          });
        }}
        onExitToPublic={exitManagement}
      />
    );
  }

  const refreshData = async () => {
    await loadBootstrap(selectedBranch);
  };

  return (
    <ManagementShell
      data={data}
      activeModule={activeModule}
      selectedBranch={selectedBranch}
      onSelectBranch={(b) => setSelectedBranch(b)}
      onSelectModule={handleSelectModule}
      onLogout={handleLogout}
      onExitToPublic={exitManagement}
    >
      {deniedModule ? (
        <div className="max-w-xl mx-auto my-8 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
            HTTP 403 · Role Access Restricted
          </p>
          <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
            Access Denied to "{deniedModule}"
          </h2>
          <p className="text-sm text-[#57534E]">
            Your active role (<strong className="text-[#1C1917]">{data.role.label}</strong>) is not authorized to open this module under Marhaba Supermarket RBAC controls.
          </p>
          <button
            type="button"
            onClick={() => handleSelectModule('dashboard')}
            className="h-10 px-4 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
          >
            Return to Today Overview
          </button>
        </div>
      ) : (
        <>
          {activeModule === 'dashboard' && (
            <ManagementDashboard data={data} onSelectModule={handleSelectModule} />
          )}
          {activeModule === 'pos' && <PosModule data={data} onRefresh={refreshData} />}
          {(activeModule === 'products' || activeModule === 'offers') && (
            <CatalogOffersModule mode={activeModule} data={data} onRefresh={refreshData} />
          )}
          {(activeModule === 'inventory' || activeModule === 'purchasing') && (
            <InventoryPurchasingModule mode={activeModule} data={data} onRefresh={refreshData} />
          )}
          {activeModule === 'orders' && <OrdersModule data={data} onRefresh={refreshData} />}
          {activeModule === 'finance' && <FinanceModule data={data} onRefresh={refreshData} />}
          {(activeModule === 'staff' || activeModule === 'branches' || activeModule === 'customers') && (
            <StaffBranchesCustomersModule mode={activeModule} data={data} onRefresh={refreshData} />
          )}
          {(activeModule === 'reports' || activeModule === 'settings') && (
            <ReportsSettingsModule mode={activeModule} data={data} onRefresh={refreshData} />
          )}
        </>
      )}
    </ManagementShell>
  );
}
