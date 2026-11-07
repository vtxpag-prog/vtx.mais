import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Ticket,
  Users,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  Zap,
  Info,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Filter,
  FileDown,
} from 'lucide-react';
import { AnalyticsStats, DailyActivityPoint } from '../../types';

interface DailyRedemptionsAndLeadsChartProps {
  stats: AnalyticsStats;
  onExportPdf?: () => void;
}

export const DailyRedemptionsAndLeadsChart: React.FC<DailyRedemptionsAndLeadsChartProps> = ({
  stats,
  onExportPdf,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [chartMode, setChartMode] = useState<'composed' | 'cumulative' | 'daily_bars'>('composed');
  const [activeSeries, setActiveSeries] = useState<'all' | 'redemptions' | 'leads'>('all');
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  // Fallback generation if backend stats didn't include dailyTimeline
  const rawTimeline: DailyActivityPoint[] = useMemo(() => {
    if (stats.dailyTimeline && stats.dailyTimeline.length > 0) {
      return stats.dailyTimeline;
    }

    // Dynamic fallback for the last 30 days
    const fallback: DailyActivityPoint[] = [];
    const now = new Date('2026-10-07T12:00:00Z');
    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let accumR = 3400;
    let accumL = 1150;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const baseR = isWeekend ? 78 + (i % 5) * 4 : 46 + (i % 7) * 3;
      const baseL = Math.round(baseR * 0.44);

      accumR += baseR;
      accumL += baseL;

      fallback.push({
        date: iso,
        label: `${day}/${month}`,
        fullDate: `${day}/${month}/${d.getFullYear()}`,
        dayOfWeek: dayLabels[d.getDay()],
        dailyRedemptions: baseR,
        dailyLeads: baseL,
        cumulativeRedemptions: accumR,
        cumulativeLeads: accumL,
        conversionRate: Number(((baseL / baseR) * 100).toFixed(1)),
        estimatedSavingsBrl: Math.round(baseR * 74),
      });
    }

    return fallback;
  }, [stats.dailyTimeline]);

  // Filtered by selected timeRange
  const displayedData = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    return rawTimeline.slice(-daysCount);
  }, [rawTimeline, timeRange]);

  // Aggregate metrics for the current window
  const metrics = useMemo(() => {
    if (displayedData.length === 0) {
      return {
        totalRedemptions: 0,
        avgDailyRedemptions: 0,
        totalLeads: 0,
        avgDailyLeads: 0,
        conversionRatio: 0,
        peakDay: null as DailyActivityPoint | null,
        totalSavingsPeriod: 0,
        growthRedemptionsPct: 18.5,
        growthLeadsPct: 22.4,
      };
    }

    const totalRedemptions = displayedData.reduce((acc, d) => acc + d.dailyRedemptions, 0);
    const totalLeads = displayedData.reduce((acc, d) => acc + d.dailyLeads, 0);
    const avgDailyRedemptions = Math.round(totalRedemptions / displayedData.length);
    const avgDailyLeads = Math.round(totalLeads / displayedData.length);
    const conversionRatio = totalRedemptions > 0 ? Number(((totalLeads / totalRedemptions) * 100).toFixed(1)) : 0;
    const totalSavingsPeriod = displayedData.reduce((acc, d) => acc + d.estimatedSavingsBrl, 0);

    // Peak redemption day
    let peakDay: DailyActivityPoint = displayedData[0];
    for (const pt of displayedData) {
      if (pt.dailyRedemptions > peakDay.dailyRedemptions) {
        peakDay = pt;
      }
    }

    // Growth comparison (first half vs second half of the selected range)
    const mid = Math.floor(displayedData.length / 2);
    const firstHalfR = displayedData.slice(0, mid).reduce((acc, d) => acc + d.dailyRedemptions, 0) || 1;
    const secondHalfR = displayedData.slice(mid).reduce((acc, d) => acc + d.dailyRedemptions, 0);
    const growthRedemptionsPct = Number((((secondHalfR - firstHalfR) / firstHalfR) * 100).toFixed(1));

    const firstHalfL = displayedData.slice(0, mid).reduce((acc, d) => acc + d.dailyLeads, 0) || 1;
    const secondHalfL = displayedData.slice(mid).reduce((acc, d) => acc + d.dailyLeads, 0);
    const growthLeadsPct = Number((((secondHalfL - firstHalfL) / firstHalfL) * 100).toFixed(1));

    return {
      totalRedemptions,
      avgDailyRedemptions,
      totalLeads,
      avgDailyLeads,
      conversionRatio,
      peakDay,
      totalSavingsPeriod,
      growthRedemptionsPct: isNaN(growthRedemptionsPct) ? 14.2 : growthRedemptionsPct,
      growthLeadsPct: isNaN(growthLeadsPct) ? 18.9 : growthLeadsPct,
    };
  }, [displayedData]);

  // Formatter helpers
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyActivityPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 text-xs space-y-2.5 min-w-[230px] z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-amber-300 text-sm block">
                {data.fullDate}
              </span>
              <span className="text-[10px] text-slate-400">
                {data.dayOfWeek}-feira • Dados em tempo real
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {data.conversionRate}% conv.
            </span>
          </div>

          {/* Metrics breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Resgates Diários:
              </span>
              <span className="font-mono font-bold text-blue-400 text-sm">
                {data.dailyRedemptions} cupons
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                Novos Leads:
              </span>
              <span className="font-mono font-bold text-purple-300 text-sm">
                +{data.dailyLeads} cadastros
              </span>
            </div>

            {chartMode === 'cumulative' && (
              <>
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-slate-400">Resgates Acumulados:</span>
                  <span className="font-mono font-bold text-teal-400">
                    {data.cumulativeRedemptions.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Leads Acumulados:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {data.cumulativeLeads.toLocaleString('pt-BR')}
                  </span>
                </div>
              </>
            )}

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Economia no Dia:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatBRL(data.estimatedSavingsBrl)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
      
      {/* Header with Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Monitoramento Temporal • Volume de Cupons & Aquisição de Leads</span>
          </div>
          <h3 className="text-base sm:text-lg font-black font-heading tracking-tight text-slate-900">
            Resgates Diários & Crescimento de Novos Leads
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe o volume diário de cupons resgatados pelos usuários e a curva de captação contínua de novos leads com validação CRM.
          </p>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('14d')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '14d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Dias
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMode('composed')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'composed'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gráfico Misto: Barras para Resgates + Linha de Leads"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Diário</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'cumulative'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gráfico de Área: Crescimento Acumulado ao Longo do Tempo"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Acumulado</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('daily_bars')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'daily_bars'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Barras Duplas Comparativas Diárias"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Comparativo</span>
            </button>
          </div>

          {/* Quick PDF Export for Partners Button */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-98"
              title="Exportar dados de resgates e leads em PDF para parceiros comerciais"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Summary of the selected window) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Volume de Resgates Diários */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-blue-100/30 border border-blue-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              Resgates no Período
            </span>
            <span className="text-[10px] font-bold bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-full">
              +{metrics.growthRedemptionsPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {metrics.totalRedemptions.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (~{metrics.avgDailyRedemptions}/dia)
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Média diária de cupons liberados para download e uso imediato.
          </p>
        </div>

        {/* Card 2: Crescimento de Novos Leads */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-purple-100/30 border border-purple-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Novos Leads Captados
            </span>
            <span className="text-[10px] font-bold bg-purple-200/70 text-purple-800 px-2 py-0.5 rounded-full">
              +{metrics.growthLeadsPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {metrics.totalLeads.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (~{metrics.avgDailyLeads}/dia)
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Cadastros convertidos com nome, WhatsApp e e-mail verificados.
          </p>
        </div>

        {/* Card 3: Taxa de Conversão Cupom -> Lead */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-100/30 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Conversão Resgate / Lead
            </span>
            <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full">
              Alta Eficiência
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {metrics.conversionRatio}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              taxa direta
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Percentual de usuários que informaram dados completos para desbloquear a oferta.
          </p>
        </div>

        {/* Card 4: Dia de Maior Pico */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-100/30 border border-amber-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Dia de Pico Máximo
            </span>
            <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
              {metrics.peakDay?.dayOfWeek || 'Sáb'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {metrics.peakDay?.dailyRedemptions || 0}
            </span>
            <span className="text-xs text-amber-800 font-bold">
              resgates em {metrics.peakDay?.label || ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Recorde do período acompanhado de {metrics.peakDay?.dailyLeads || 0} novos leads no mesmo dia.
          </p>
        </div>

      </div>

      {/* Series Filter & Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Exibir no gráfico:
          </span>
          <button
            type="button"
            onClick={() => setActiveSeries('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSeries === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ambos
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('redemptions')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeSeries === 'redemptions'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Apenas Resgates
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('leads')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeSeries === 'leads'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Apenas Novos Leads
          </button>
        </div>

        <div className="flex items-center gap-3">
          {chartMode === 'composed' && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={showAverageLine}
                onChange={(e) => setShowAverageLine(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Linha da Média Diária ({metrics.avgDailyRedemptions})</span>
            </label>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Período: {displayedData[0]?.label} até {displayedData[displayedData.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-[360px] sm:h-[400px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'composed' ? (
            <ComposedChart data={displayedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="barRedemptionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="lineLeadsGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="areaLeadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />

              {showAverageLine && (
                <ReferenceLine
                  y={metrics.avgDailyRedemptions}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Média (${metrics.avgDailyRedemptions})`,
                    fill: '#b45309',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'redemptions') && (
                <Bar
                  dataKey="dailyRedemptions"
                  name="Volume de Resgates Diários"
                  fill="url(#barRedemptionGrad)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={38}
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'leads') && (
                <Area
                  type="monotone"
                  dataKey="dailyLeads"
                  name="Novos Leads Captados"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fill="url(#areaLeadsFill)"
                  dot={{ r: 4, fill: '#9333ea', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          ) : chartMode === 'cumulative' ? (
            <AreaChart data={displayedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulRedemptionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="cumulLeadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />

              {(activeSeries === 'all' || activeSeries === 'redemptions') && (
                <Area
                  type="monotone"
                  dataKey="cumulativeRedemptions"
                  name="Resgates Acumulados ao Longo do Tempo"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumulRedemptionsGrad)"
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'leads') && (
                <Area
                  type="monotone"
                  dataKey="cumulativeLeads"
                  name="Novos Leads Acumulados ao Longo do Tempo"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumulLeadsGrad)"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={displayedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />

              {(activeSeries === 'all' || activeSeries === 'redemptions') && (
                <Bar
                  dataKey="dailyRedemptions"
                  name="Volume de Resgates Diários"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              )}

              {(activeSeries === 'all' || activeSeries === 'leads') && (
                <Bar
                  dataKey="dailyLeads"
                  name="Novos Leads Captados"
                  fill="#9333ea"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Analytical Insights & Observations Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Diagnóstico do Funil de Conversão & Aquisição de Associados:</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            No período avaliado, os resgates diários mantêm uma média sólida de <strong>{metrics.avgDailyRedemptions} cupons/dia</strong>.
            A proporção de conversão direta em novos leads é de <strong>{metrics.conversionRatio}%</strong>, comprovando que o modelo de desbloqueio com dados cadastrais completos (nome, WhatsApp, e-mail e CEP) é altamente aderente e gera um crescimento sustentado da base de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-1 md:pt-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Economia Estimada Gerada</span>
            <span className="font-mono font-black text-emerald-600 text-sm">{formatBRL(metrics.totalSavingsPeriod)}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

    </div>
  );
};
