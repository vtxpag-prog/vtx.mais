import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  X,
  Building2,
  Calendar,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  Users,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsStats, Lead, Partner, AdminUser } from '../../types';
import {
  generatePdfReport,
  downloadPdfBlob,
  PDFReportOptions,
} from '../../utils/pdfReportGenerator';

interface ExportReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AnalyticsStats;
  leads: Lead[];
  partners: Partner[];
  currentUser: AdminUser;
}

export const ExportReportPdfModal: React.FC<ExportReportPdfModalProps> = ({
  isOpen,
  onClose,
  stats,
  leads,
  partners,
  currentUser,
}) => {
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30); // 7, 14, 30, 0
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeDailyTimeline, setIncludeDailyTimeline] = useState(true);
  const [includeTopOffers, setIncludeTopOffers] = useState(true);
  const [includeCategoriesAndRegions, setIncludeCategoriesAndRegions] = useState(true);
  const [includeLeadsList, setIncludeLeadsList] = useState(true);
  const [customNotes, setCustomNotes] = useState(
    'Apresentação de resultados consolidados de resgates e novos leads no Clube VTXMais. Campanha em pleno andamento com alto engajamento dos associados.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Selected partner name
  const partnerObj = partners.find((p) => p.id === selectedPartner);
  const partnerDisplayName =
    selectedPartner === 'all'
      ? 'Todos os Parceiros Comerciais'
      : partnerObj?.name || 'Parceiro Comercial';

  // Leads count matching filter
  const filteredLeadsCount =
    selectedPartner === 'all'
      ? leads.length
      : leads.filter(
          (l) =>
            l.partnerName.toLowerCase() === partnerDisplayName.toLowerCase() ||
            (l as any).partnerId === selectedPartner
        ).length;

  const handleExport = async (action: 'download' | 'preview') => {
    try {
      setIsGenerating(true);
      setSuccessNotice(false);

      const options: PDFReportOptions = {
        partnerId: selectedPartner,
        partnerName: partnerDisplayName,
        periodDays: selectedPeriod,
        includeExecutiveSummary,
        includeDailyTimeline,
        includeTopOffers,
        includeCategoriesAndRegions,
        includeLeadsList,
        customNotes,
        generatedBy: currentUser.name || currentUser.username || 'Gestor Comercial VTXMais',
      };

      const result = await generatePdfReport(stats, leads, partners, options);

      if (action === 'download') {
        downloadPdfBlob(result.blob, result.filename);
        setSuccessNotice(true);
        setTimeout(() => setSuccessNotice(false), 4000);
      } else {
        window.open(result.previewUrl, '_blank');
      }
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Exportar Relatório Executivo em PDF
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Parceiros Comerciais
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gere um relatório analítico para reuniões comerciais e prestação de contas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-6 flex-1">
          {successNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Relatório PDF gerado e baixado com sucesso! O arquivo está pronto para ser enviado ao parceiro.
              </span>
            </div>
          )}

          {/* Partner & Period Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Commercial Partner Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Parceiro Comercial de Destino</span>
              </label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="all">🌐 Todos os Parceiros (Relatório Consolidado)</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏢 {p.name} ({p.category})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Filtra as métricas, ofertas e leads específicos da empresa parceira.
              </p>
            </div>

            {/* Time Period Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Janela Temporal dos Dados</span>
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value={7}>📅 Últimos 7 dias (Semanal)</option>
                <option value={14}>📅 Últimos 14 dias (Quinzenal)</option>
                <option value={30}>📅 Últimos 30 dias (Mensal)</option>
                <option value={0}>📅 Histórico Completo Acumulado</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Define a amplitude de dias na tabela de evolução e nos gráficos.
              </p>
            </div>
          </div>

          {/* Metrics Preview Pill */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filtro atual:</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {partnerDisplayName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <b>{filteredLeadsCount}</b> leads
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-slate-400" />
                <b>{stats.dailyTimeline?.length || 30}</b> dias de histórico
              </span>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Seções do Documento a Incluir no PDF
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setIncludeExecutiveSummary(!includeExecutiveSummary)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  includeExecutiveSummary
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {includeExecutiveSummary ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">1. Sumário & KPIs Executivos</span>
                  <span className="text-[11px] text-slate-500">
                    Total de leads, resgates, conversão e economia gerada
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeDailyTimeline(!includeDailyTimeline)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  includeDailyTimeline
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {includeDailyTimeline ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">2. Tabela de Resgates Diários</span>
                  <span className="text-[11px] text-slate-500">
                    Acompanhamento diário e acumulado de resgates e leads
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeTopOffers(!includeTopOffers)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  includeTopOffers
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {includeTopOffers ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">3. Ranking de Ofertas Ativadas</span>
                  <span className="text-[11px] text-slate-500">
                    Atratividade de cupons e taxa de conversão direta
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeCategoriesAndRegions(!includeCategoriesAndRegions)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  includeCategoriesAndRegions
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {includeCategoriesAndRegions ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">4. Categorias & Geografia</span>
                  <span className="text-[11px] text-slate-500">
                    Interesse de consumo e concentração por estado (UF)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeLeadsList(!includeLeadsList)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all sm:col-span-2 ${
                  includeLeadsList
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {includeLeadsList ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">5. Relação Nominal de Leads & Cupons Gerados</span>
                  <span className="text-[11px] text-slate-500">
                    Amostragem com nome, telefone/WhatsApp, código de cupom e localização
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Notes / Message to Partner */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Nota Personalizada / Parecer Comercial (Opcional)</span>
              <span className="text-[11px] text-slate-400 font-normal">Aparecerá com destaque no PDF</span>
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Adicione observações para o parceiro, recomendações de renovação ou destaques de campanhas..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Formato A4 Executivo com timbrado e bloco de assinaturas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={() => handleExport('preview')}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Visualizar Prévia</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('download')}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-98 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF Oficial</span>
                </>
              )}
            </button>
          </div>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
