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

  const loadBootstrap = useCallback(async (branchScope = 'all') => {
    try {
      const payload = await managementApi.bootstrap(branchScope);
      setData(payload);
      setActiveModule((prev) => {
        const fromUrl = extractModuleFromPath(window.location.pathname);
        const preferred = window.location.pathname === '/management' ? prev : fromUrl;
        const permitted = payload.permittedModules.some((m) => m.id === preferred);
        return permitted ? preferred : 'dashboard';
      });
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
    if (data.permittedModules.some((m) => m.id === slug)) {
      setActiveModule(slug);
    }
  }, [managementPath, data]);

  const handleSelectModule = (moduleId: ManagementModuleId) => {
    setActiveModule(moduleId);
    navigateToManagement(`/management/${moduleId}`);
  };

  const handleLogout = async () => {
    await managementApi.logout();
    setData(null);
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
    </ManagementShell>
  );
}
