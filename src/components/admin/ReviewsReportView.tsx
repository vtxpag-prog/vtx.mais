import React, { useEffect, useState, useMemo } from 'react';
import { ReviewsReport, OfferReview, AdminUser } from '../../types';
import { api } from '../../services/api';
import {
  Star,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Award,
  Users,
  Building2,
  Calendar,
  ThumbsUp,
  Tag,
} from 'lucide-react';

interface ReviewsReportViewProps {
  currentUser: AdminUser;
}

export const ReviewsReportView: React.FC<ReviewsReportViewProps> = ({ currentUser }) => {
  const [report, setReport] = useState<ReviewsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewsReport();
      setReport(data);
    } catch (err) {
      console.error('Falha ao carregar relatório descritivo de avaliações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Unique partner list for filter dropdown
  const partnersList = useMemo(() => {
    if (!report) return [];
    const set = new Set<string>();
    report.recentReviews.forEach((r) => set.add(r.partnerName));
    return Array.from(set).sort();
  }, [report]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (!report) return [];
    return report.recentReviews.filter((rev) => {
      // Star rating filter
      if (selectedRating !== 'all' && rev.rating !== selectedRating) {
        return false;
      }
      // Partner filter
      if (selectedPartner !== 'all' && rev.partnerName !== selectedPartner) {
        return false;
      }
      // Search keyword filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesComment = rev.comment.toLowerCase().includes(query);
        const matchesUser = rev.userName.toLowerCase().includes(query);
        const matchesOffer = rev.offerTitle.toLowerCase().includes(query);
        const matchesPartner = rev.partnerName.toLowerCase().includes(query);
        const matchesCity = rev.userCity?.toLowerCase().includes(query);
        if (!matchesComment && !matchesUser && !matchesOffer && !matchesPartner && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [report, selectedRating, selectedPartner, searchTerm]);

  // Export descriptive CSV
  const handleExportCsv = () => {
    if (!report || report.recentReviews.length === 0) return;

    const headers = [
      'ID',
      'Data_Avaliacao',
      'Associado',
      'Cidade',
      'Oferta',
      'Parceiro',
      'Categoria',
      'Estrelas',
      'Resgate_Verificado',
      'Codigo_Cupom',
      'Comentario_Descritivo',
    ];

    const rows = report.recentReviews.map((r) => [
      r.id,
      new Date(r.createdAt).toLocaleString('pt-BR'),
      `"${r.userName.replace(/"/g, '""')}"`,
      `"${(r.userCity || '').replace(/"/g, '""')}"`,
      `"${r.offerTitle.replace(/"/g, '""')}"`,
      `"${r.partnerName.replace(/"/g, '""')}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      r.rating,
      r.verifiedRedemption ? 'SIM' : 'NAO',
      r.couponCode || '',
      `"${(r.comment || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-avaliacoes-vtxmais-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-amber-900/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Inteligência de Satisfação & Qualidade de Ofertas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
            Relatório Descritivo de Avaliações
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Consolidado de notas (1 a 5 estrelas) e relatos descritivos enviados pelos associados após o resgate de cupons nas lojas e estabelecimentos parceiros.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadReport}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Recarregar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 cursor-pointer shadow-md"
            title="Download da planilha CSV com todos os comentários e notas"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Média Geral */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Média do Clube
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-heading">
              {report.averageClubRating.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Classificação Excelente (97%+)</span>
          </div>
        </div>

        {/* NPS Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Índice NPS Estimado
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-heading">
              +{report.npsScore}
            </span>
            <span className="text-xs text-blue-600 font-bold">Zona de Excelência</span>
          </div>
          <div className="text-xs text-slate-500">
            Promotores (4-5★) vs Detratores (1-2★)
          </div>
        </div>

        {/* Total de Avaliações */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Avaliações
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {report.totalReviews}
          </div>
          <div className="text-xs text-slate-500">
            Feedbacks pós-resgate de cupom
          </div>
        </div>

        {/* Resgates Verificados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resgates Verificados
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {report.verifiedPercentage}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold">
            Cupons validados no sistema
          </div>
        </div>

      </div>

      {/* Middle Section: Star Breakdown & Best/Worst Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Star Rating Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Distribuição por Estrelas
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {report.totalReviews} votos
            </span>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = report.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = report.totalReviews > 0 ? Math.round((count / report.totalReviews) * 100) : 0;
              const isSelected = selectedRating === stars;

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setSelectedRating(isSelected ? 'all' : stars)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition text-left cursor-pointer ${
                    isSelected ? 'bg-amber-50 ring-2 ring-amber-400' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1 w-20 shrink-0 text-xs font-bold text-slate-700">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-400 font-normal">estrelas</span>
                  </div>

                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars === 5
                          ? 'bg-emerald-500'
                          : stars === 4
                          ? 'bg-blue-500'
                          : stars === 3
                          ? 'bg-amber-400'
                          : stars === 2
                          ? 'bg-orange-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="w-14 text-right text-xs font-semibold text-slate-600 shrink-0">
                    {count} ({percentage}%)
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRating !== 'all' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setSelectedRating('all')}
                className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Limpar filtro de {selectedRating} estrelas (Ver todas)
              </button>
            </div>
          )}
        </div>

        {/* Rankings: Top Rated & Attention Offers (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Rated Offers */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Ofertas com Maior Satisfação (Top 5)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Líderes de Elogios
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {report.topRatedOffers.map((item, idx) => (
                <div key={item.offerId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.offerTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{item.partnerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-900">{item.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-500">({item.reviewsCount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attention / Quality Alert */}
          {report.lowestRatedOffers.some((o) => o.rating < 4.5) && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Radar de Qualidade & Convênios
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Monitore parceiros com notas abaixo de 4.5 estrelas para alinhar instruções de resgate com as equipes de atendimento dos estabelecimentos.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Feed Descritivo Completo de Avaliações dos Usuários */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Header & Filter Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Feed Descritivo de Avaliações dos Associados
              </h3>
              <p className="text-xs text-slate-500">
                Mostrando {filteredReviews.length} de {report.totalReviews} avaliações registradas
              </p>
            </div>

            {/* Quick Star Filters Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedRating('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedRating === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Todas ({report.totalReviews})
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedRating(s)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedRating === s
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{s}★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Input & Partner Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por comentário, nome do associado, parceiro ou cidade..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400 font-medium"
              >
                <option value="all">Todos os Parceiros</option>
                {partnersList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">
              Nenhuma avaliação encontrada com os filtros selecionados
            </h4>
            <p className="text-xs text-slate-400">
              Tente redefinir os filtros de estrelas ou a palavra-chave de busca.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition space-y-3">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {rev.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {rev.userName}
                        </span>
                        {rev.userCity && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {rev.userCity}
                          </span>
                        )}
                        {rev.verifiedRedemption && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Resgate Verificado</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-700">{rev.partnerName}</span>
                        <span>—</span>
                        <span className="text-slate-500 truncate max-w-xs">{rev.offerTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars Display & Date */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-amber-900 ml-1">
                        {rev.rating}.0
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rev.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Descriptive Comment Text */}
                {rev.comment ? (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-normal">
                    <p className="italic font-serif">"{rev.comment}"</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    (Associado atribuiu a nota sem comentário adicional)
                  </div>
                )}

                {/* Footer Tag & Coupon Code */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-500" />
                    <span>Categoria: {rev.category}</span>
                  </span>
                  {rev.couponCode && (
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                      Cupom: {rev.couponCode}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
