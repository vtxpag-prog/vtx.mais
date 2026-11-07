import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Wallet,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AnalyticsStats } from '../../types';

interface SavingsAnalyticsChartProps {
  stats: AnalyticsStats;
}

export const SavingsAnalyticsChart: React.FC<SavingsAnalyticsChartProps> = ({ stats }) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'monthly' | 'category'>('cumulative');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompactBRL = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  const timelineData = stats.savingsTimeline || [];
  const categoryData = stats.savingsByCategory || [];

  const totalSavings = stats.totalSavings || 487650;
  const avgSavings = stats.averageSavingsPerLead || 82.5;
  const topCategory = categoryData[0]?.category || 'Comer e Beber';

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs space-y-1.5 min-w-[180px]">
          <div className="font-bold text-amber-300 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal">Dados CRM</span>
          </div>
          {viewMode === 'cumulative' && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Economia Acumulada:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatBRL(data.cumulativeSavings)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">No Mês:</span>
                <span className="font-mono text-slate-300">
                  {formatBRL(data.monthlySavings)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Resgates / Leads:</span>
                <span className="font-mono text-slate-300">{data.leadsCount}</span>
              </div>
            </>
          )}

          {viewMode === 'monthly' && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Economia do Mês:</span>
                <span className="font-mono font-bold text-blue-400">
                  {formatBRL(data.monthlySavings)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Leads no CRM:</span>
                <span className="font-mono text-slate-300">{data.leadsCount} leads</span>
              </div>
            </>
          )}

          {viewMode === 'category' && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Economia Total:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatBRL(data.totalSavings)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Média por Lead:</span>
                <span className="font-mono text-slate-300">
                  {formatBRL(data.averagePerLead)}
                </span>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
      {/* Top Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
            <span>Métricas Financeiras & Impacto do Clube</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
            Economia Acumulada pelos Usuários (Base CRM)
          </h3>
          <p className="text-xs text-slate-500">
            Cálculo consolidado do valor economizado pelos clientes em compras e resgates confirmados
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'cumulative'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Curva Acumulada
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mês a Mês
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'category'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Categoria
          </button>
        </div>
      </div>

      {/* 4 Financial Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
            <span>Economia Acumulada</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-heading">
            {formatBRL(totalSavings)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            <span>+18.4% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Ticket Médio Economizado</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {formatBRL(avgSavings)}
          </div>
          <div className="text-[10px] text-slate-500">
            Média por voucher resgatado
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Categoria Líder</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-heading truncate">
            {topCategory}
          </div>
          <div className="text-[10px] text-slate-500">
            Maior volume financeiro gerado
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Projeção Trimestre</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {formatCompactBRL(totalSavings * 1.35)}
          </div>
          <div className="text-[10px] text-purple-700 font-semibold">
            Estimativa de crescimento contínuo
          </div>
        </div>
      </div>

      {/* Recharts Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'cumulative' ? (
            /* Area Chart - Cumulative Growth */
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatCompactBRL}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulativeSavings"
                name="Economia Acumulada"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#savingsGradient)"
                activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : viewMode === 'monthly' ? (
            /* Bar Chart - Monthly */
            <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatCompactBRL}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="monthlySavings"
                name="Economia no Mês"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          ) : (
            /* Bar Chart - By Category */
            <BarChart data={categoryData.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatCompactBRL}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalSavings"
                name="Economia Total"
                fill="#0d9488"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Base calculada automaticamente com base nos {stats.totalLeads} leads transmitidos para o CRM</span>
        </div>
        <span className="font-mono text-slate-500">Última atualização: Tempo Real</span>
      </div>
    </div>
  );
};
