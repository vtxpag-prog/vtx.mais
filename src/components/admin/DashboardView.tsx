import React, { useEffect, useState } from 'react';
import { AnalyticsStats, AdminUser, CRMHealthReport } from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Eye,
  TrendingUp,
  Building2,
  Tag,
  ArrowUpRight,
  Download,
  Plus,
  Flame,
  CheckCircle2,
  Activity,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { AdminTab } from './AdminLayout';
import { SavingsAnalyticsChart } from './SavingsAnalyticsChart';
import { CouponRedemptionsTrendChart } from './CouponRedemptionsTrendChart';
import { UserSavingsSummary } from './UserSavingsSummary';

interface DashboardViewProps {
  currentUser: AdminUser;
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [crmHealth, setCrmHealth] = useState<CRMHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [data, health] = await Promise.all([
        api.getAnalytics(),
        api.getCrmHealth().catch(() => null),
      ]);
      setStats(data);
      setCrmHealth(health);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Operando em Tempo Real
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            Olá, {currentUser.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Acompanhe o desempenho do Clube de Benefícios, volume de cupons liberados e taxas de conversão de leads por categoria.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('points_financial')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Wallet className="w-4 h-4 text-blue-200" />
            <span>Conta Mãe & Pontos</span>
          </button>
          {currentUser.role !== 'visualizador' && (
            <button
              onClick={() => onNavigate('offers')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Oferta</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('leads')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Ver Leads ({stats.totalLeads})</span>
          </button>
        </div>
      </div>

      {/* Componente Proeminente de Economia Pessoal do Usuário Logado */}
      <UserSavingsSummary
        currentUser={currentUser}
        onExploreOffers={() => onNavigate('offers')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Leads
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.totalLeads}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Dados sincronizados com CRM</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.conversionRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            Resgates de cupons vs. visualizações
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Visualizações de Ofertas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.totalViews.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-500">
            Acessos registrados nas ofertas
          </div>
        </div>

        {/* Active Partners & Offers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rede Credenciada
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.activePartners}{' '}
            <span className="text-base font-normal text-slate-400">parceiros</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.activeOffers} ofertas e cupons ativos
          </div>
        </div>
      </div>

      {/* Widget de Monitoramento de Saúde do Webhook CRM (.env) */}
      {crmHealth && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              crmHealth.state === 'healthy'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : crmHealth.state === 'degraded'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                  Status de Saúde do Webhook CRM
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  crmHealth.state === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : crmHealth.state === 'degraded'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    crmHealth.state === 'healthy' ? 'bg-emerald-500 animate-pulse' : crmHealth.state === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <span>
                    {crmHealth.state === 'healthy'
                      ? 'Conectado (200 OK)'
                      : crmHealth.state === 'degraded'
                      ? `Degradado (HTTP ${crmHealth.statusCode || 'Erro'})`
                      : 'Falha de Conexão'}
                  </span>
                </span>
                {crmHealth.latencyMs > 0 && (
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    ⚡ {crmHealth.latencyMs}ms
                  </span>
                )}
                {crmHealth.envVarDefined && (
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                    .env ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xl mt-0.5">
                {crmHealth.webhookUrl || 'Nenhuma URL de webhook definida no .env'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('crm')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Diagnóstico Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Visualização Gráfica Recharts: Tendência de Resgates de Cupons nos Últimos 30 Dias */}
      <CouponRedemptionsTrendChart stats={stats} />

      {/* Visualização Gráfica Recharts: Economia Acumulada pelos Usuários baseada no CRM */}
      <SavingsAnalyticsChart stats={stats} />

      {/* Grid: Top Offers & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Offers Ranking */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Ofertas Mais Resgatadas (Top Performance)
              </h3>
              <p className="text-xs text-slate-500">
                Ranking de atratividade e volume de cupons liberados
              </p>
            </div>
            <button
              onClick={() => onNavigate('offers')}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {stats.topOffers.map((offer, idx) => (
              <div
                key={offer.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {offer.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {offer.partner}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-end">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{offer.saves} resgates</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {offer.conversion}% conversão
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Category Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Distribuição por Categoria
            </h3>
            <p className="text-xs text-slate-500">
              Interesse dos usuários nas 13 categorias
            </p>
          </div>

          <div className="space-y-3">
            {stats.leadsByCategory.slice(0, 6).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate pr-2">
                    {cat.category}
                  </span>
                  <span className="text-slate-500 font-bold shrink-0">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage || 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Leads Table Preview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Últimos Leads Capturados
            </h3>
            <p className="text-xs text-slate-500">
              Entradas mais recentes sincronizadas com CRM
            </p>
          </div>
          <button
            onClick={() => onNavigate('leads')}
            className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Gerenciar todos os leads ({stats.totalLeads})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Nome do Lead</th>
                <th className="pb-3">Telefone/WhatsApp</th>
                <th className="pb-3">Cupom Resgatado</th>
                <th className="pb-3">Localização/CEP</th>
                <th className="pb-3">CRM Webhook</th>
                <th className="pb-3 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">
                    {lead.name}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {lead.email}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{lead.phone}</td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {lead.couponCode}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                      {lead.offerTitle}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">
                    {lead.userCep}
                    <span className="block text-[10px] text-slate-400">
                      {lead.userCity}/{lead.userState}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.crmStatus === 'sucesso'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {lead.crmStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-500">
                    {new Date(lead.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
