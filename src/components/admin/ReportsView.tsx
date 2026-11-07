import React, { useEffect, useState } from 'react';
import { AnalyticsStats, AdminUser, Lead, Partner } from '../../types';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Sparkles,
  PieChart,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  FileDown,
  Building2,
  Share2,
} from 'lucide-react';
import { SavingsAnalyticsChart } from './SavingsAnalyticsChart';
import { CategoryConversionChart } from './CategoryConversionChart';
import { DailyRedemptionsAndLeadsChart } from './DailyRedemptionsAndLeadsChart';
import { ExportReportPdfModal } from './ExportReportPdfModal';

interface ReportsViewProps {
  currentUser: AdminUser;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, leadsList, partnersList] = await Promise.all([
        api.getAnalytics(),
        api.getLeads().catch(() => []),
        api.getPartners().catch(() => []),
      ]);
      setStats(data);
      setLeads(leadsList);
      setPartners(partnersList);
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

  const maxCategoryCount = Math.max(...stats.leadsByCategory.map((c) => c.count), 1);
  const maxRegionCount = Math.max(...stats.leadsByRegion.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Header with PDF Export Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Inteligência de Mercado & Conversão de Ofertas</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Relatórios & Métricas de Desempenho
          </h2>
          <p className="text-xs text-slate-500">
            Análise aprofundada de atratividade de marcas, interesse por categorias e distribuição geográfica de CEPs.
          </p>
        </div>

        {/* Action Button: Export to PDF for commercial partners */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Relatório em PDF</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-semibold text-white">
              Parceiros
            </span>
          </button>
        </div>
      </div>

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Conversão Média</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.conversionRate}%
          </div>
          <p className="text-xs text-slate-500">
            De cada 100 visualizações, aproximadamente {Math.round(stats.conversionRate)} viram leads cadastrados.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Volume de Leads</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.totalLeads}
          </div>
          <p className="text-xs text-slate-500">
            Leads validados com dados completos de nome, WhatsApp, e-mail e CEP.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Engajamento Total</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {stats.totalViews.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-slate-500">
            Total de acessos a ofertas distribuídos pelas 13 categorias do clube.
          </p>
        </div>
      </div>

      {/* Visualização Gráfica Recharts: Volume de Resgates Diários e Crescimento de Novos Leads */}
      <DailyRedemptionsAndLeadsChart
        stats={stats}
        onExportPdf={() => setIsExportModalOpen(true)}
      />

      {/* Visualização Gráfica Recharts: Taxa de Conversão de Leads por Categoria de Oferta */}
      <CategoryConversionChart stats={stats} />

      {/* Visualização Gráfica Recharts: Painel de Economia Acumulada */}
      <SavingsAnalyticsChart stats={stats} />

      {/* Chart 1: Most Accessed & Redeemed Offers */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Ranking das Ofertas Mais Resgatadas (Conversão por Oferta)
          </h3>
          <p className="text-xs text-slate-500">
            Volume absoluto de cupons liberados e taxa de conversão direta
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {stats.topOffers.map((offer) => {
            const pct = Math.min(100, Math.round((offer.saves / (stats.topOffers[0]?.saves || 1)) * 100));

            return (
              <div key={offer.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="truncate pr-4">
                    <span className="font-bold text-slate-800">{offer.title}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({offer.partner})</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-slate-900 font-mono">
                      {offer.saves} resgates
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {offer.conversion}% conversão
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Leads by Category & Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Interesse por Categoria
            </h3>
            <p className="text-xs text-slate-500">
              Distribuição de leads entre as 13 categorias oficiais
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {stats.leadsByCategory.map((cat) => {
              const barWidth = Math.max(10, Math.round((cat.count / maxCategoryCount) * 100));

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate pr-2">
                      {cat.category}
                    </span>
                    <span className="font-mono text-slate-600 font-bold shrink-0">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Distribution by CEP / Region */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Distribuição Geográfica por CEP / Estado (UF)
            </h3>
            <p className="text-xs text-slate-500">
              Concentração regional de usuários que informaram CEP e resgataram ofertas
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {stats.leadsByRegion.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Sem registros regionais ainda.
              </p>
            ) : (
              stats.leadsByRegion.map((region) => {
                const barWidth = Math.max(15, Math.round((region.count / maxRegionCount) * 100));

                return (
                  <div key={region.state} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Estado: {region.state}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">
                        {region.count} leads
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500 mt-4 space-y-1">
              <span className="font-bold text-slate-700 block">
                Como funciona a geolocalização no Clube VTXMais?
              </span>
              <p className="text-[11px] leading-relaxed">
                Ao digitar o CEP, a plataforma calcula as coordenadas geográficas exatas e aplica a fórmula de Haversine para determinar a distância em quilômetros até as filiais dos parceiros cadastrados.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Commercial Partner Export Callout Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Apresentação de Resultados Comerciais</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-heading text-white">
              Apresente o ROI e o Volume de Resgates aos seus Parceiros
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Exporte dossiês completos com gráficos de evolução temporal de resgates, captação de leads, ranking de cupons ativados e assinaturas comerciais em formato PDF de alta fidelidade.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-lg shadow-blue-600/30 active:scale-98 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Gerar PDF para Parceiro</span>
          </button>
        </div>
      </div>

      {/* PDF Export Modal */}
      <ExportReportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        stats={stats}
        leads={leads}
        partners={partners}
        currentUser={currentUser}
      />
    </div>
  );
};
