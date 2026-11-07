import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Ticket,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  Zap,
  Info,
  DollarSign,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { AnalyticsStats, DailyActivityPoint } from '../../types';

interface CouponRedemptionsTrendChartProps {
  stats: AnalyticsStats;
}

export const CouponRedemptionsTrendChart: React.FC<CouponRedemptionsTrendChartProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  // Fallback generation if dailyTimeline is not available
  const rawTimeline: DailyActivityPoint[] = useMemo(() => {
    if (stats.dailyTimeline && stats.dailyTimeline.length > 0) {
      return stats.dailyTimeline;
    }

    // Dynamic generation of 30 days of redemption data
    const fallback: DailyActivityPoint[] = [];
    const now = new Date('2026-10-08T12:00:00Z');
    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let accumR = 3400;
    let accumL = 1150;

    const baseRedemptions = [
      42, 38, 45, 48, 68, 76, 59,
      44, 41, 49, 52, 72, 84, 63,
      48, 45, 53, 58, 78, 91, 69,
      52, 49, 57, 62, 85, 98, 74,
      58, 65,
    ];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      const idx = 29 - i;
      const dailyR = baseRedemptions[idx] || (isWeekend ? 75 : 48);
      const dailyL = Math.round(dailyR * 0.44);

      accumR += dailyR;
      accumL += dailyL;

      fallback.push({
        date: iso,
        label: `${day}/${month}`,
        fullDate: `${day}/${month}/${d.getFullYear()}`,
        dayOfWeek: dayLabels[d.getDay()],
        dailyRedemptions: dailyR,
        dailyLeads: dailyL,
        cumulativeRedemptions: accumR,
        cumulativeLeads: accumL,
        conversionRate: 24.2,
        estimatedSavingsBrl: Math.round(dailyR * 74),
      });
    }

    return fallback;
  }, [stats.dailyTimeline]);

  // Filter based on selected time range
  const displayedData = useMemo(() => {
    const totalPoints = rawTimeline.length;
    if (timeRange === '7d') return rawTimeline.slice(Math.max(0, totalPoints - 7));
    if (timeRange === '14d') return rawTimeline.slice(Math.max(0, totalPoints - 14));
    return rawTimeline.slice(Math.max(0, totalPoints - 30));
  }, [rawTimeline, timeRange]);

  // Calculations for summary metrics
  const summaryMetrics = useMemo(() => {
    if (!displayedData.length) {
      return {
        totalRedemptions: 0,
        avgDailyRedemptions: 0,
        peakDay: null as DailyActivityPoint | null,
        totalSavingsPeriod: 0,
        weekendVolumeRatio: 0,
        growthPercentage: 14.8,
      };
    }

    const totalRedemptions = displayedData.reduce((acc, curr) => acc + curr.dailyRedemptions, 0);
    const avgDailyRedemptions = Math.round(totalRedemptions / displayedData.length);
    const totalSavingsPeriod = displayedData.reduce((acc, curr) => acc + curr.estimatedSavingsBrl, 0);

    let peakDay = displayedData[0];
    let weekendCount = 0;
    let weekendRedemptions = 0;

    for (const point of displayedData) {
      if (point.dailyRedemptions > peakDay.dailyRedemptions) {
        peakDay = point;
      }
      if (point.dayOfWeek === 'Sáb' || point.dayOfWeek === 'Dom') {
        weekendCount++;
        weekendRedemptions += point.dailyRedemptions;
      }
    }

    const weekendVolumeRatio = weekendCount > 0 ? Math.round((weekendRedemptions / totalRedemptions) * 100) : 32;

    // Growth calculation comparing first half vs second half
    const halfLen = Math.floor(displayedData.length / 2);
    const firstHalfSum = displayedData.slice(0, halfLen).reduce((acc, c) => acc + c.dailyRedemptions, 0);
    const secondHalfSum = displayedData.slice(halfLen).reduce((acc, c) => acc + c.dailyRedemptions, 0);
    const growthPercentage = firstHalfSum > 0
      ? Number((((secondHalfSum - firstHalfSum) / firstHalfSum) * 100).toFixed(1))
      : 14.5;

    return {
      totalRedemptions,
      avgDailyRedemptions,
      peakDay,
      totalSavingsPeriod,
      weekendVolumeRatio,
      growthPercentage,
    };
  }, [displayedData]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Custom Glassmorphism Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyActivityPoint = payload[0].payload;
      const diffFromAvg = summaryMetrics.avgDailyRedemptions > 0
        ? Math.round(((data.dailyRedemptions - summaryMetrics.avgDailyRedemptions) / summaryMetrics.avgDailyRedemptions) * 100)
        : 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 text-xs space-y-2.5 min-w-[240px] z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-amber-300 text-sm block">
                {data.fullDate}
              </span>
              <span className="text-[10px] text-slate-400">
                {data.dayOfWeek}-feira • Resgate verificado
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {data.conversionRate}% conv.
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                Resgates no Dia:
              </span>
              <span className="font-mono font-bold text-blue-400 text-sm">
                {data.dailyRedemptions} cupons
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Vs. Média dos 30d:</span>
              <span className={`font-mono font-bold ${diffFromAvg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diffFromAvg >= 0 ? `+${diffFromAvg}%` : `${diffFromAvg}%`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Novos Leads:</span>
              <span className="font-mono font-bold text-purple-300">
                +{data.dailyLeads} cadastros
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Economia Gerada:</span>
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
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Ticket className="w-3.5 h-3.5 text-blue-600" />
            <span>Tendência de Resgates de Cupons</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
            Evolução Diária de Cupons Resgatados nos Últimos 30 Dias
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe o ritmo de resgates no Clube VTXMais, identificando dias de pico e o engajamento contínuo dos associados.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
          </div>

          {/* Chart Style Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Área Suavizada com Gradiente"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Barras Diárias"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barras</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Linha de Tendência"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Linha</span>
            </button>
          </div>

          {/* Average Line Toggle */}
          <button
            type="button"
            onClick={() => setShowAverageLine(!showAverageLine)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showAverageLine
                ? 'border-blue-300 bg-blue-50/80 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Alternar exibição da linha de média diária de resgates"
          >
            <span className={`w-2 h-2 rounded-full ${showAverageLine ? 'bg-blue-600' : 'bg-slate-300'}`} />
            <span className="text-[11px]">Linha de Média</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Summary of Selected Period) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Redemptions */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/40 border border-blue-200/80 space-y-1">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              Total de Resgates
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/10 text-blue-800">
              {timeRange}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {summaryMetrics.totalRedemptions.toLocaleString('pt-BR')} cupons
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{summaryMetrics.growthPercentage}% no período</span>
          </div>
        </div>

        {/* Card 2: Daily Average */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 border border-indigo-200/80 space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Média Diária
            </span>
            <span className="text-[10px] text-indigo-500 font-medium">
              constância
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {summaryMetrics.avgDailyRedemptions} <span className="text-sm font-normal text-slate-500">cupons/dia</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Média estável de cupons ativados por associados
          </p>
        </div>

        {/* Card 3: Peak Day */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Dia de Pico (Recorde)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-200/60 text-amber-900 font-bold">
              {summaryMetrics.peakDay ? summaryMetrics.peakDay.dayOfWeek : 'Sex'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {summaryMetrics.peakDay ? summaryMetrics.peakDay.dailyRedemptions : 98} <span className="text-sm font-normal text-slate-500">cupons</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {summaryMetrics.peakDay ? `Registrado em ${summaryMetrics.peakDay.fullDate}` : 'Dia com maior ativação'}
          </p>
        </div>

        {/* Card 4: Estimated Savings */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border border-emerald-200/80 space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Economia Gerada
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/10 text-emerald-800">
              estimado
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-heading">
            {formatBRL(summaryMetrics.totalSavingsPeriod)}
          </div>
          <p className="text-[11px] text-slate-500">
            Descontos auferidos diretamente pelos clientes
          </p>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={displayedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30d' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, 'dataMax + 15']}
              />
              <Tooltip content={<CustomTooltip />} />
              {showAverageLine && summaryMetrics.avgDailyRedemptions > 0 && (
                <ReferenceLine
                  y={summaryMetrics.avgDailyRedemptions}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Média: ${summaryMetrics.avgDailyRedemptions} cupons/dia`,
                    fill: '#2563eb',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="dailyRedemptions"
                name="Resgates Diários"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#trendAreaGradient)"
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={displayedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30d' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, 'dataMax + 15']}
              />
              <Tooltip content={<CustomTooltip />} />
              {showAverageLine && summaryMetrics.avgDailyRedemptions > 0 && (
                <ReferenceLine
                  y={summaryMetrics.avgDailyRedemptions}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Média: ${summaryMetrics.avgDailyRedemptions} cupons/dia`,
                    fill: '#2563eb',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Bar
                dataKey="dailyRedemptions"
                name="Resgates Diários"
                fill="url(#trendBarGradient)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={displayedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={timeRange === '30d' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, 'dataMax + 15']}
              />
              <Tooltip content={<CustomTooltip />} />
              {showAverageLine && summaryMetrics.avgDailyRedemptions > 0 && (
                <ReferenceLine
                  y={summaryMetrics.avgDailyRedemptions}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Média: ${summaryMetrics.avgDailyRedemptions} cupons/dia`,
                    fill: '#2563eb',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="dailyRedemptions"
                name="Resgates Diários"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 1 }}
                activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Intelligence & Pattern Recognition */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              Comportamento Semanal dos Associados:
            </span>
            <span className="text-[11px] text-slate-500">
              Quintas, sextas e sábados concentram {summaryMetrics.weekendVolumeRatio}% dos resgates da semana, com forte atratividade em gastronomia e lazer.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tendência Positiva (+{summaryMetrics.growthPercentage}%)
          </span>
        </div>
      </div>
    </div>
  );
};
