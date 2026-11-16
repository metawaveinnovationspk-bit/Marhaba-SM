import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, ShieldCheck, Store, UserCheck } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../../erp/permissions';
import { INITIAL_STAFF_USERS } from '../../erp/seedData';
import type { RoleTier } from '../../erp/types';
import { MarhabaLogo } from '../Header/SiteHeader';
import { managementApi } from './managementApi';

interface ManagementLoginProps {
  onSuccess: () => void;
  onExitToPublic: () => void;
}

const TIER_LABELS: { id: RoleTier; title: string; subtitle: string }[] = [
  {
    id: 'frontline',
    title: 'Frontline Store & Counter Roles',
    subtitle: 'Branch-restricted access; costs & margins hidden',
  },
  {
    id: 'operational',
    title: 'Department & Branch Management',
    subtitle: 'Operational authority across stock, procurement, orders & cash',
  },
  {
    id: 'technical',
    title: 'Technical & M.I.S. Administration',
    subtitle: 'Catalogue integrity, RBAC, sync feeds & audit governance',
  },
  {
    id: 'executive',
    title: 'Executive Board (Published Leadership — Demo Access)',
    subtitle: 'Multi-branch oversight & high-value approval authority',
  },
];

export function ManagementLogin({ onSuccess, onExitToPublic }: ManagementLoginProps) {
  const [identifier, setIdentifier] = useState('cashier.hyd@marhaba.demo');
  const [pin, setPin] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (targetId: string, targetPin: string) => {
    setError(null);
    setLoading(true);
    try {
      await managementApi.login(targetId, targetPin);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLogin(identifier, pin);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex flex-col">
      {/* Slim Header Bar */}
      <header className="bg-[#FFFFFF] border-b border-[#E6E2DA] px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MarhabaLogo />
          <span className="hidden sm:inline-block h-5 w-px bg-[#E6E2DA]" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-[#57534E] truncate">
            Supermarket Management System
          </span>
        </div>
        <button
          type="button"
          onClick={onExitToPublic}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] hover:text-[#9B1C2E] transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Website</span>
        </button>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 lg:px-8 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Staff Authentication Form */}
        <section className="lg:col-span-5 lg:sticky lg:top-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#9B1C2E]/8 text-[#9B1C2E] text-[11px] font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Authentication Required</span>
          </div>

          <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Marhaba Management Portal
          </h1>
          <p className="mt-1.5 text-sm text-[#57534E]">
            Proposed MWI Solution by <strong className="font-semibold text-[#1C1917]">MetaWave Innovations LTD</strong> · Retail Supermarket Operations Only.
          </p>

          <div className="mt-5 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-xs text-[#57534E] space-y-1">
            <p className="font-semibold text-[#1C1917] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0" />
              <span>Strict Customer-Staff Isolation &amp; Safe Demo Notice</span>
            </p>
            <p>
              Public customer logins cannot access any management route. All accounts below use demo PIN{' '}
              <code className="font-mono font-semibold text-[#1C1917]">demo1234</code> and operate on an in-memory demonstration ledger.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="mgmt-id" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Staff Email or Employee Code
              </label>
              <input
                id="mgmt-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. cashier.hyd@marhaba.demo or MRH-EMP-042"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm text-[#1C1917] focus:bg-[#FFFFFF] focus:border-[#9B1C2E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="mgmt-pin" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Staff Demo PIN
              </label>
              <input
                id="mgmt-pin"
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter demo PIN (demo1234)"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm text-[#1C1917] focus:bg-[#FFFFFF] focus:border-[#9B1C2E] focus:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#9B1C2E]/8 border border-[#9B1C2E]/25 text-xs font-medium text-[#9B1C2E]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying Credentials...' : 'Sign In to Management Portal'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6E2DA] flex items-center justify-between text-[11px] text-[#57534E]">
            <span className="inline-flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#9B1C2E]" />
              <span>Hyderabad · Karachi P10-A · Karachi P2</span>
            </span>
            <span>Restaurant &amp; Play Land Excluded</span>
          </div>
        </section>

        {/* Right: Organized Quick Demo Role Switcher */}
        <section className="lg:col-span-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917]">
              Quick Role Demonstration Sign-In
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Select any staff role to authenticate against the Express backend and inspect live server-enforced permissions, views, and approval segregation.
            </p>
          </div>

          <div className="space-y-4">
            {TIER_LABELS.map((tier) => {
              const users = INITIAL_STAFF_USERS.filter(
                (u) => ROLE_DEFINITIONS[u.roleId]?.tier === tier.id
              );
              return (
                <div
                  key={tier.id}
                  className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-[#E6E2DA]">
                    <h3 className="text-sm font-bold text-[#1C1917]">{tier.title}</h3>
                    <span className="text-[11px] text-[#57534E]">{tier.subtitle}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {users.map((u) => {
                      const roleDef = ROLE_DEFINITIONS[u.roleId];
                      return (
                        <button
                          key={u.id}
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setIdentifier(u.email);
                            setPin(u.demoPin);
                            void performLogin(u.email, u.demoPin);
                          }}
                          className="text-left p-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:border-[#9B1C2E] hover:bg-[#FFFFFF] transition-colors flex items-start justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#9B1C2E] truncate">
                              {roleDef.label}
                            </p>
                            <p className="text-xs text-[#57534E] truncate mt-0.5">{u.fullName}</p>
                            <p className="text-[11px] font-mono text-[#57534E] mt-1">
                              {u.employeeCode} · {u.branchId === 'all' ? 'All Branches' : u.branchId}
                            </p>
                          </div>
                          <UserCheck className="w-4 h-4 text-[#57534E] group-hover:text-[#9B1C2E] shrink-0 mt-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
