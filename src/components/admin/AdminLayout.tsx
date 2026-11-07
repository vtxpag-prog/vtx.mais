import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Tag,
  Building2,
  Users,
  Webhook,
  BarChart3,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  PiggyBank,
  Trophy,
  Ticket,
  Kanban,
  BellRing,
  Download,
  Contrast,
  Star,
  Wallet,
  Store,
  Receipt,
  Briefcase,
} from 'lucide-react';
import { AdminUser, CRMHealthState } from '../../types';
import { userCouponsService, api } from '../../services/api';
import { getUserGamificationState } from '../../utils/userLevels';

export type AdminTab =
  | 'dashboard'
  | 'my_savings'
  | 'voucher_history'
  | 'offers'
  | 'partners'
  | 'leads'
  | 'advertisers'
  | 'partner_portal'
  | 'partner_settlements'
  | 'crm'
  | 'push_schedules'
  | 'reports'
  | 'reviews'
  | 'points_financial';

interface AdminLayoutProps {
  currentUser: AdminUser;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  onLogout: () => void;
  children: React.ReactNode;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onExitAdmin,
  onLogout,
  children,
  isHighContrast = false,
  onToggleHighContrast = () => {},
}) => {
  const isVisualizador = currentUser.role === 'visualizador';
  const isGestor = currentUser.role === 'gestor';
  const isAdmin = currentUser.role === 'admin';

  const [downloading, setDownloading] = useState(false);
  const [crmHealthState, setCrmHealthState] = useState<CRMHealthState | null>(null);

  useEffect(() => {
    api.getCrmHealth().then((h) => setCrmHealthState(h.state)).catch(() => setCrmHealthState(null));
  }, []);

  const handleDownloadFrontPage = async () => {
    if (!isAdmin) {
      alert('Acesso restrito: Somente administradores têm permissão para baixar o arquivo HTML da front page.');
      return;
    }

    try {
      setDownloading(true);
      const res = await fetch(`/api/download/frontpage?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: {
          'x-user-id': currentUser.id,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao realizar o download.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'frontpage-clube-vtxmais.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Falha ao baixar o arquivo.');
    } finally {
      setDownloading(false);
    }
  };

  // Gamification state
  const userKey = currentUser?.username || currentUser?.email || currentUser?.id || 'admin';
  const userCoupons = userCouponsService.getRedeemedCoupons(userKey);
  const totalSavings = userCouponsService.calculateTotalSavings(userCoupons);
  const gamification = getUserGamificationState(userCoupons, totalSavings);

  const menuItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    roleRestricted?: boolean;
  }> = [
    { id: 'dashboard', label: 'Visão Geral (KPIs)', icon: LayoutDashboard },
    { id: 'my_savings', label: 'Minha Economia Pessoal', icon: PiggyBank, badge: 'Destaque' },
    { id: 'voucher_history', label: 'Histórico de Vouchers', icon: Ticket, badge: 'Validade' },
    { id: 'offers', label: 'Gestão de Ofertas & Cupons', icon: Tag },
    { id: 'partners', label: 'Gestão de Parceiros', icon: Building2 },
    { id: 'partner_portal', label: 'Validador POS (Lojista)', icon: Store, badge: 'Fase 12' },
    { id: 'partner_settlements', label: 'Clearing & Repasses B2B', icon: Receipt, badge: 'Financeiro' },
    { id: 'leads', label: 'Leads & Funil Kanban', icon: Kanban, badge: 'Fases' },
    { id: 'advertisers', label: 'Pipeline B2B (Anunciantes)', icon: Briefcase, badge: 'SLA 24h' },
    {
      id: 'crm',
      label: 'Integração CRM / Webhooks',
      icon: Webhook,
      roleRestricted: isVisualizador,
    },
    {
      id: 'push_schedules',
      label: 'Notificações Push Semanais',
      icon: BellRing,
      badge: 'Semanal',
      roleRestricted: isVisualizador,
    },
    { id: 'reports', label: 'Relatórios & Inteligência', icon: BarChart3 },
    {
      id: 'reviews',
      label: 'Avaliações & NPS',
      icon: Star,
      badge: 'Estrelas',
    },
    {
      id: 'points_financial',
      label: 'Conta Mãe & Pontos',
      icon: Wallet,
      badge: 'Financeiro',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-slate-700/60 shadow-xs">
                <img
                  src="/logo_vtx_mais.png"
                  alt="Logo VTXMais"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-white text-sm tracking-tight font-heading">
                  VTX<span className="text-blue-500">MAIS</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  Painel de Controle
                </span>
              </div>
            </div>
          </div>

          {/* User profile card with Gamification Level Badge */}
          <div className="p-3.5 mx-3 my-3 bg-slate-800/80 rounded-2xl border border-slate-700/70 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {(currentUser.name || currentUser.username || 'AD').slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.name || currentUser.username}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isAdmin
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isGestor
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {currentUser.role}
                  </span>

                  {/* Visual level badge in profile */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('my_savings')}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 cursor-pointer transition border hover:brightness-110 ${gamification.currentLevel.tagClass}`}
                    title={`Nível do Clube: ${gamification.currentLevel.badgeTitle}`}
                  >
                    <span>{gamification.currentLevel.badgeEmoji}</span>
                    <span>{gamification.currentLevel.name}</span>
                  </button>
                </div>

                {/* Emblema Ativo de Conquista */}
                {gamification.activeBadge && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTab('voucher_history')}
                      className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 hover:bg-amber-400/30 transition cursor-pointer truncate max-w-full"
                      title={`Conquista Conquistada: ${gamification.activeBadge.title} — ${gamification.activeBadge.description}`}
                    >
                      <span>{gamification.activeBadge.icon}</span>
                      <span className="truncate font-black">{gamification.activeBadge.title}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Progress Bar to next level */}
            <div
              onClick={() => onSelectTab('my_savings')}
              className="pt-2 border-t border-slate-700/60 cursor-pointer hover:opacity-90 transition space-y-1"
              title="Clique para ver seus emblemas e detalhes de economia"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>{gamification.nextLevel ? `Próximo: ${gamification.nextLevel.name}` : 'Nível Máximo'}</span>
                </span>
                <span className="text-slate-300 font-bold">{gamification.couponsCount} cupons</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${gamification.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Profile Quick Voucher & Savings Buttons */}
            <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSelectTab('voucher_history')}
                className="py-1.5 px-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                title="Ver histórico de vouchers e prazos de validade"
              >
                <Ticket className="w-3 h-3 text-blue-400" />
                <span>Vouchers</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('my_savings')}
                className="py-1.5 px-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 transition cursor-pointer border border-slate-700"
                title="Ver extrato de economia pessoal"
              >
                <PiggyBank className="w-3 h-3 text-emerald-400" />
                <span>Extrato</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDisabled = item.roleRestricted;

              return (
                <button
                  key={item.id}
                  disabled={isDisabled}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDisabled
                      ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'crm' && crmHealthState ? (
                    <span className="flex items-center gap-1.5" title={`Webhook CRM: ${crmHealthState}`}>
                      <span className={`w-2 h-2 rounded-full ${
                        crmHealthState === 'healthy'
                          ? 'bg-emerald-400 animate-pulse'
                          : crmHealthState === 'degraded'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`} />
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                        {crmHealthState === 'healthy' ? 'OK' : 'Alerta'}
                      </span>
                    </span>
                  ) : item.badge ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isAdmin && (
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadFrontPage}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 text-xs font-semibold transition cursor-pointer"
              title="Exclusivo Administrador: Baixar arquivo HTML completo da Front Page"
            >
              <Download className={`w-3.5 h-3.5 text-blue-400 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Baixando HTML...' : 'Baixar HTML Front Page'}</span>
            </button>
          )}
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Ver Clube Público</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-950/40 text-rose-300 text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-heading">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              Gestão centralizada do Clube de Benefícios VTXMais
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de Alto Contraste (Acessibilidade) */}
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-pressed={isHighContrast}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-400 ring-2 ring-yellow-400 font-extrabold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title={isHighContrast ? 'Desativar Modo de Alto Contraste' : 'Ativar Modo de Alto Contraste'}
            >
              <Contrast className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHighContrast ? 'Contraste: ON' : 'Alto Contraste'}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadFrontPage}
                className="text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download do HTML estático da Front Page (Exclusivo Administrador)"
              >
                <Download className={`w-3.5 h-3.5 text-blue-600 ${downloading ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">{downloading ? 'Baixando...' : 'Baixar HTML Front Page'}</span>
                <span className="sm:hidden">HTML</span>
              </button>
            )}

            <button
              onClick={onExitAdmin}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ir para o Site</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
