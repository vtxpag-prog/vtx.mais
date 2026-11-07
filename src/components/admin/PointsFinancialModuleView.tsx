import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  History,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  Play,
  FileCheck,
  Check,
  X,
  CreditCard,
  AlertOctagon,
  ChevronRight,
  UserCheck,
  Lock,
  Download,
  Database,
  Copy,
  Code2,
  Table,
  CheckCheck,
} from 'lucide-react';
import {
  AdminUser,
  MotherAccountState,
  PointsRequest,
  PointsLedgerEntry,
  TimeTravelSnapshot,
  ReplaySimulationResult,
  PointsRiskAlert,
  UserPointsWallet,
} from '../../types';
import { pointsService } from '../../services/pointsService';

interface PointsFinancialModuleViewProps {
  currentUser: AdminUser;
}

export const PointsFinancialModuleView: React.FC<PointsFinancialModuleViewProps> = ({
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'mother_account' | 'approvals' | 'ledger' | 'time_travel' | 'replay' | 'rates_risk' | 'database_schema'
  >('mother_account');

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [motherAccount, setMotherAccount] = useState<MotherAccountState | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PointsRequest[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<PointsLedgerEntry[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<PointsRiskAlert[]>([]);
  const [wallets, setWallets] = useState<UserPointsWallet[]>([]);

  // Database Schema (Módulo 10) state
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedTableTab, setSelectedTableTab] = useState<string>('pontos_saldos');
  const [schemaViewMode, setSchemaViewMode] = useState<'tables' | 'sql' | 'constraints'>('tables');

  // Time Travel state
  const [timeTravelDate, setTimeTravelDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [timeTravelSnapshot, setTimeTravelSnapshot] = useState<TimeTravelSnapshot | null>(null);
  const [runningTimeTravel, setRunningTimeTravel] = useState(false);

  // Replay state
  const [replayResult, setReplayResult] = useState<ReplaySimulationResult | null>(null);
  const [runningReplay, setRunningReplay] = useState(false);

  // Rate Update state
  const [newRatePercent, setNewRatePercent] = useState<string>('1.0');
  const [rateReason, setRateReason] = useState<string>('Alinhamento de política de fidelidade');
  const [updatingRate, setUpdatingRate] = useState(false);
  const [rateSuccessMsg, setRateSuccessMsg] = useState<string | null>(null);

  // Approval decision state
  const [decisionModal, setDecisionModal] = useState<{
    request: PointsRequest;
    decision: 'aprovado' | 'rejeitado';
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  // Ledger filters
  const [ledgerFilterOp, setLedgerFilterOp] = useState<string>('todos');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ma, appr, ledg, alerts, wList] = await Promise.all([
        pointsService.getMotherAccount().catch(() => null),
        pointsService.getPendingApprovals().catch(() => []),
        pointsService.getLedger().catch(() => []),
        pointsService.getRiskAlerts().catch(() => []),
        pointsService.getAllWallets().catch(() => []),
      ]);
      setMotherAccount(ma);
      setPendingApprovals(appr);
      setLedgerEntries(ledg);
      setRiskAlerts(alerts);
      setWallets(wList);
    } catch (err) {
      console.error('Erro ao carregar dados do módulo financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Database Schema Handlers
  const loadDatabaseSchema = async () => {
    try {
      setLoadingSchema(true);
      const data = await pointsService.getDatabaseSchema();
      setSchemaData(data);
    } catch (err) {
      console.error('Erro ao carregar schema do banco de dados:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'database_schema' && !schemaData) {
      loadDatabaseSchema();
    }
  }, [activeSubTab]);

  const handleCopySql = () => {
    if (schemaData?.rawSql) {
      navigator.clipboard.writeText(schemaData.rawSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleDownloadSql = () => {
    if (!schemaData?.rawSql) return;
    const blob = new Blob([schemaData.rawSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vtxmais_modulo10_schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Time Travel Handler
  const handleExecuteTimeTravel = async () => {
    try {
      setRunningTimeTravel(true);
      const snap = await pointsService.runTimeTravel(timeTravelDate);
      setTimeTravelSnapshot(snap);
    } catch (err: any) {
      alert(err.message || 'Falha ao executar Time Travel.');
    } finally {
      setRunningTimeTravel(false);
    }
  };

  // Replay Sandbox Handler
  const handleRunReplay = async () => {
    try {
      setRunningReplay(true);
      const res = await pointsService.runReplaySimulation();
      setReplayResult(res);
    } catch (err: any) {
      alert(err.message || 'Falha ao executar Sandbox de Replay.');
    } finally {
      setRunningReplay(false);
    }
  };

  // Update Rate Handler
  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(newRatePercent) / 100;
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 0.5) {
      alert('Informe uma taxa válida entre 0% e 50%.');
      return;
    }
    try {
      setUpdatingRate(true);
      await pointsService.updatePointsRate(rateVal, rateReason, undefined, currentUser);
      setRateSuccessMsg(`Taxa padrão atualizada para ${(rateVal * 100).toFixed(2)}% com sucesso!`);
      setTimeout(() => setRateSuccessMsg(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar taxa.');
    } finally {
      setUpdatingRate(false);
    }
  };

  // Decision submit
  const handleConfirmDecision = async () => {
    if (!decisionModal) return;
    try {
      setProcessingDecision(true);
      await pointsService.decideApproval(
        decisionModal.request.id,
        decisionModal.decision,
        currentUser,
        decisionReason
      );
      setDecisionModal(null);
      setDecisionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar decisão.');
    } finally {
      setProcessingDecision(false);
    }
  };

  // Filtered Ledger
  const filteredLedger = ledgerEntries.filter((item) => {
    if (ledgerFilterOp !== 'todos' && item.operacao !== ledgerFilterOp) {
      return false;
    }
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      const matchDesc = item.descricao.toLowerCase().includes(q);
      const matchTx = item.transaction_id.toLowerCase().includes(q);
      const matchUser = item.usuario_id.toLowerCase().includes(q);
      return matchDesc || matchTx || matchUser;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Módulo Central de Pontos Financeiros & Ledger Imutável</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
              Conta Mãe & Liquidação Financeira
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Gestão centralizada de paridade, aquisições PIX, autorizações por alçada, conciliação
              matemática em tempo real e auditoria por Time Travel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Dados</span>
            </button>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conciliação ACID Ativa</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-white/10 mt-6 no-scrollbar">
          {[
            { id: 'mother_account', label: 'Conta Mãe & Conciliação', icon: Building2 },
            {
              id: 'approvals',
              label: `Fila de Alçadas (${pendingApprovals.length})`,
              icon: UserCheck,
              highlight: pendingApprovals.length > 0,
            },
            { id: 'ledger', label: 'Ledger Imutável', icon: Layers },
            { id: 'time_travel', label: 'Time Travel Financeiro', icon: History },
            { id: 'replay', label: 'Sandbox de Replay', icon: Play },
            { id: 'rates_risk', label: 'Paridade & Alertas de Risco', icon: Percent },
            { id: 'database_schema', label: 'Estrutura BD (Módulo 10)', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                } ${tab.highlight && !isActive ? 'border border-amber-400/50 text-amber-300' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: CONTA MÃE & CONCILIAÇÃO */}
      {activeSubTab === 'mother_account' && (
        <div className="space-y-6">
          {/* Status da Conciliação Banner */}
          {motherAccount && motherAccount.status_conciliacao === 'divergencia' ? (
            <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-3xl flex items-start gap-4 text-rose-900">
              <AlertOctagon className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-wide text-rose-800">
                    ALERTA NÍVEL 5 — DIVERGÊNCIA MATEMÁTICA DETECTADA!
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                    BLOQUEIO ATIVO
                  </span>
                </div>
                <p className="text-xs text-rose-700">
                  A soma dos saldos dos usuários difere do saldo real da Conta Mãe em{' '}
                  <strong>
                    R$ {Math.abs(motherAccount.diferenca_conciliacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  . Novas transações de compra/saque estão bloqueadas preventivamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Fórmula de Conciliação Perfeita (100% Batida)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Saldo Conta Mãe (R${' '}
                    {motherAccount?.saldo_total_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    ) = Σ(Disponíveis) + Σ(Bloqueados) + Σ(Processamento)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
                Status: Conciliado
              </span>
            </div>
          )}

          {/* Cards de Métricas da Conta Mãe */}
          {motherAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Saldo Conta Mãe</span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  R$ {motherAccount.saldo_total_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  CNPJ: {motherAccount.cnpj} ({motherAccount.razao_social})
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Saldos Disponíveis</span>
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  R$ {motherAccount.total_saldos_disponiveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  {motherAccount.total_usuarios_ativos} carteiras ativas
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Saldos Bloqueados (Alçadas)</span>
                  <Lock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700">
                  R$ {motherAccount.total_saldos_bloqueados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  Aguardando aprovação de supervisores
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cartões Pré-Pagos Emitidos</span>
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  R$ {motherAccount.total_cartoes_emitidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  Carga em cartões físicos/virtuais
                </div>
              </div>
            </div>
          )}

          {/* Dados Bancários Oficiais da Entidade Gestora */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Parâmetros e Vínculo Institucional da Conta Mãe
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Razão Social & Entidade</span>
                <span className="font-bold text-slate-900">{motherAccount?.razao_social}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">CNPJ Vinculado</span>
                <span className="font-mono font-bold text-slate-900">{motherAccount?.cnpj}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Domicílio Bancário</span>
                <span className="font-bold text-slate-900">
                  {motherAccount?.banco} - Ag {motherAccount?.agencia} / CC {motherAccount?.conta_corrente}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Carteiras de Usuários Cadastrados */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Carteiras de Usuários Integradas ao Clube
                </h3>
                <p className="text-xs text-slate-500">
                  Dados herdados do núcleo da plataforma com saldos de pontos em tempo real
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">
                {wallets.length} Usuários
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">CPF / E-mail</th>
                    <th className="py-3 px-4">Disponível (Pts)</th>
                    <th className="py-3 px-4">Bloqueado</th>
                    <th className="py-3 px-4">Taxa Desconto</th>
                    <th className="py-3 px-4">Versão ACID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wallets.map((w) => (
                    <tr key={w.usuario_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {w.usuario_nome}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {w.usuario_cpf || w.usuario_email}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {w.saldo_disponivel_pontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pts
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600">
                        {w.saldo_bloqueado_pontos > 0
                          ? `${w.saldo_bloqueado_pontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pts`
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {(w.taxa_desconto_pontos * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono">
                          v{w.saldo_version}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FILA DE ALÇADAS E APROVAÇÕES */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Política de Alçadas de Liquidação Financeira
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block">Até R$ 500,00</span>
                <span className="text-emerald-700 text-[11px]">Aprovação Automática Instantânea</span>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 block">R$ 500,01 a R$ 5.000,00</span>
                <span className="text-blue-700 text-[11px]">Exige 1 aprovação: Supervisor</span>
              </div>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <span className="font-bold text-indigo-900 block">R$ 5.000,01 a R$ 20.000,00</span>
                <span className="text-indigo-700 text-[11px]">Exige 2 aprovações: Supervisor + Gerente</span>
              </div>
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-900 block">Acima de R$ 20.000,01</span>
                <span className="text-purple-700 text-[11px]">Supervisor + Gerente + Diretor</span>
              </div>
            </div>
          </div>

          {/* Fila de Solicitações Pendentes */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Solicitações de Saque PIX Aguardando Decisão
                </h3>
                <p className="text-xs text-slate-500">
                  Pontos já encontram-se bloqueados no saldo do usuário e serão baixados ao aprovar
                </p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
                {pendingApprovals.length} Pendentes
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma solicitação pendente de aprovação!
                </p>
                <p className="text-xs text-slate-500">
                  Todas as transferências e liquidações estão em dia.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApprovals.map((req) => (
                  <div key={req.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.usuario_nome}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Alçada: {req.alcada_necessaria.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(req.criado_em).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>
                          Valor: <strong className="text-slate-900 font-bold">R$ {req.valor_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({req.valor_pontos} pts)
                        </span>
                        <span>•</span>
                        <span>
                          Chave PIX: <strong className="font-mono text-slate-800">{req.chave_pix_destino?.chave}</strong> ({req.chave_pix_destino?.tipo})
                        </span>
                      </div>

                      {/* Status das aprovações já colhidas */}
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="text-slate-500">Aprovações necessárias:</span>
                        {req.aprovacoes_necessarias.map((tier) => {
                          const obtida = req.aprovacoes_obtidas.some(
                            (o) => o.nivel === tier && o.decisao === 'aprovado'
                          );
                          return (
                            <span
                              key={tier}
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                obtida
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {tier} {obtida ? '✓' : 'pendente'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botões de Ação para o Usuário Logado */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setDecisionModal({ request: req, decision: 'rejeitado' })
                        }
                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeitar / Devolver</span>
                      </button>

                      <button
                        onClick={() =>
                          setDecisionModal({ request: req, decision: 'aprovado' })
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar Saque</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LEDGER IMUTÁVEL */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          {/* Barra de Filtro do Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Buscar por descrição, Transaction ID ou Usuário..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={ledgerFilterOp}
                onChange={(e) => setLedgerFilterOp(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
              >
                <option value="todos">Todas as Operações</option>
                <option value="compra_pix">Aquisição PIX (Crédito)</option>
                <option value="pagamento_parceiro">Pagamento Parceiro (Débito)</option>
                <option value="resgate_saque_pix">Saque PIX (Débito)</option>
                <option value="emissao_cartao">Emissão de Cartão</option>
                <option value="estorno_reversao">Estorno / Compensação</option>
              </select>
            </div>
          </div>

          {/* Tabela do Ledger Imutável */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Ledger de Movimentações (Append-Only)
                </h3>
                <p className="text-xs text-slate-500">
                  Lançamentos contábeis estritamente imutáveis com concorrência versionada
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">
                {filteredLedger.length} Lançamentos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição & Operação</th>
                    <th className="py-3 px-4">Valor (Pts)</th>
                    <th className="py-3 px-4">Saldo Anterior / Posterior</th>
                    <th className="py-3 px-4">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(row.data).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            row.tipo === 'C'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.tipo === 'C' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {row.tipo === 'C' ? 'Crédito' : 'Débito'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{row.descricao}</div>
                        <div className="text-[10px] text-slate-400">
                          {row.origem} → {row.destino}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        <span className={row.tipo === 'C' ? 'text-emerald-600' : 'text-slate-800'}>
                          {row.tipo === 'C' ? '+' : '-'}
                          {row.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {row.saldo_anterior.toFixed(2)} →{' '}
                        <strong className="text-slate-900">{row.saldo_posterior.toFixed(2)}</strong>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] truncate max-w-[140px]">
                        {row.transaction_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TIME TRAVEL FINANCEIRO */}
      {activeSubTab === 'time_travel' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Auditoria Histórica — Time Travel Financeiro
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reconstrua matematicamente o saldo da Conta Mãe e a carteira de usuários em qualquer
                instante do passado, reprocessando os eventos até o carimbo temporal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-bold text-slate-700">Data e Hora de Consulta:</label>
                <input
                  type="datetime-local"
                  value={timeTravelDate}
                  onChange={(e) => setTimeTravelDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>

              <button
                onClick={handleExecuteTimeTravel}
                disabled={runningTimeTravel}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{runningTimeTravel ? 'Reconstruindo...' : 'Reconstruir Saldo'}</span>
              </button>
            </div>
          </div>

          {/* Resultado do Snapshot Histórico */}
          {timeTravelSnapshot && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-500">Fotografia Reconstruída em</span>
                  <h4 className="font-black text-slate-900 text-base">
                    {new Date(timeTravelSnapshot.data_solicitada).toLocaleString('pt-BR')}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Status: {timeTravelSnapshot.status_integridade.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Saldo Conta Mãe na Data</span>
                  <span className="text-xl font-black text-slate-900">
                    R$ {timeTravelSnapshot.saldo_conta_mae_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Saldos Disponíveis na Data</span>
                  <span className="text-xl font-black text-emerald-600">
                    R$ {timeTravelSnapshot.saldo_disponivel_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Lançamentos Processados até a Data</span>
                  <span className="text-xl font-black text-blue-600">
                    {timeTravelSnapshot.total_lancamentos_ate_data} eventos
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: SANDBOX DE REPLAY */}
      {activeSubTab === 'replay' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                Sandbox de Replay de Produção Anonimizado
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Executa simulações determinísticas de replay para validar integridade, concorrência e
                detecção de race-conditions sem impactar dados reais.
              </p>
            </div>

            <button
              onClick={handleRunReplay}
              disabled={runningReplay}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{runningReplay ? 'Executando Sandbox Replay...' : 'Disparar Replay de Auditoria'}</span>
            </button>
          </div>

          {replayResult && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm">{replayResult.nome_cenario}</h4>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {replayResult.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Total de Eventos</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {replayResult.total_eventos_processados}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Sucesso</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {replayResult.eventos_sucesso}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Tempo de Execução</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {replayResult.tempo_execucao_ms} ms
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Divergências</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {replayResult.divergencias.length === 0 ? 'Nenhuma' : replayResult.divergencias.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: TAXA DE PARIDADE & ALERTAS DE RISCO */}
      {activeSubTab === 'rates_risk' && (
        <div className="space-y-6">
          {/* Gestão de Taxas de Paridade */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              Paridade de Pontos & Taxa de Desconto
            </h3>
            <p className="text-xs text-slate-500">
              Fórmula de crédito: <code>pontos_creditados = valor_pago × (1 - taxa_desconto_pontos)</code>.
              Toda alteração é registrada com carimbo de auditoria e justificativa obrigatória.
            </p>

            {rateSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {rateSuccessMsg}
              </div>
            )}

            <form onSubmit={handleUpdateRate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nova Taxa (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={newRatePercent}
                  onChange={(e) => setNewRatePercent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  placeholder="ex: 1.0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Justificativa da Alteração</label>
                <input
                  type="text"
                  value={rateReason}
                  onChange={(e) => setRateReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  placeholder="Motivo formal para a auditoria..."
                />
              </div>

              <button
                type="submit"
                disabled={updatingRate}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                {updatingRate ? 'Gravando...' : 'Atualizar Taxa Oficial'}
              </button>
            </form>
          </div>

          {/* Alertas de Risco e Fraude */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Painel de Alertas de Risco & Monitoramento Contínuo
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoramento de picos atípicos de compra, saques sequenciais e conciliação
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">
                {riskAlerts.length} Alertas
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {riskAlerts.map((alt) => (
                <div key={alt.id} className="p-4 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      alt.nivel >= 4
                        ? 'bg-rose-100 text-rose-600'
                        : alt.nivel === 3
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">
                        Nível {alt.nivel} — {alt.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(alt.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{alt.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: ESTRUTURA DO BANCO DE DADOS (MÓDULO 10) */}
      {activeSubTab === 'database_schema' && (
        <div className="space-y-6">
          {/* Header Banner Módulo 10 */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Database className="w-56 h-56 text-indigo-400" />
            </div>
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold tracking-wide uppercase">
                  Módulo 10 — Especificação de Banco de Dados
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  PostgreSQL 14+ / ANSI SQL
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  Triggers Append-Only Ativos
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Estrutura de Tabelas & Persistência ACID da Carteira
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Modelo de dados relacional oficial para a carteira de pontos do Clube VTXMais.
                Segregação estrita entre <strong>pontos_saldos</strong> (controle de versão e concorrência),
                <strong>pontos_lancamentos</strong> (ledger contábil imutável append-only com trigger de proteção) e
                <strong>pontos_solicitacoes</strong> (fila transacional de alçadas e liquidações PIX).
              </p>
            </div>
          </div>

          {/* Cards de Métricas em Tempo Real das Tabelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card pontos_saldos */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Concorrência
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Tabela</span>
                <h4 className="font-mono text-sm font-bold text-slate-900">pontos_saldos</h4>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Registros Ativos:</span>
                <span className="font-bold text-slate-900">
                  {schemaData?.runtimeStats?.tabelas?.pontos_saldos?.total_registros ?? wallets.length}
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>saldo_version & saldo &gt;= 0</span>
              </div>
            </div>

            {/* Card pontos_lancamentos */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  Append-Only
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Tabela</span>
                <h4 className="font-mono text-sm font-bold text-slate-900">pontos_lancamentos</h4>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Lançamentos no Ledger:</span>
                <span className="font-bold text-slate-900">
                  {schemaData?.runtimeStats?.tabelas?.pontos_lancamentos?.total_registros ?? ledgerEntries.length}
                </span>
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Trigger imutável: 0 deletes/updates</span>
              </div>
            </div>

            {/* Card pontos_solicitacoes */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  Alçadas & PIX
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Tabela</span>
                <h4 className="font-mono text-sm font-bold text-slate-900">pontos_solicitacoes</h4>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Fila Transacional:</span>
                <span className="font-bold text-slate-900">
                  {schemaData?.runtimeStats?.tabelas?.pontos_solicitacoes?.total_registros ?? pendingApprovals.length}
                </span>
              </div>
              <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingApprovals.length} pendentes de alçada</span>
              </div>
            </div>

            {/* Card pontos_conta_mae */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Conta Mãe
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Tabela</span>
                <h4 className="font-mono text-sm font-bold text-slate-900">pontos_conta_mae</h4>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Custódia Bancária:</span>
                <span className="font-bold text-emerald-700">
                  R$ {(motherAccount?.saldo_total_reais ?? 154800).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Conciliação matemática 100%</span>
              </div>
            </div>
          </div>

          {/* Barra de Seleção de Modo e Ações */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSchemaViewMode('tables')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  schemaViewMode === 'tables'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Dicionário de Dados & Tabelas</span>
              </button>
              <button
                onClick={() => setSchemaViewMode('sql')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  schemaViewMode === 'sql'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Script DDL SQL (PostgreSQL)</span>
              </button>
              <button
                onClick={() => setSchemaViewMode('constraints')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  schemaViewMode === 'constraints'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Matriz de Governança & Regras ACID</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                title="Copiar script SQL para a área de transferência"
              >
                {copiedSql ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">SQL Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar DDL SQL</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadSql}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                title="Download do arquivo schema.sql oficial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar schema.sql</span>
              </button>
              <button
                onClick={loadDatabaseSchema}
                disabled={loadingSchema}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Recarregar estatísticas"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSchema ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* MODO 1: TABELAS & DICIONÁRIO DE DADOS */}
          {schemaViewMode === 'tables' && (
            <div className="space-y-4">
              {/* Seletor de Tabela */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'pontos_saldos', label: '1. pontos_saldos', badge: 'Saldos & Concorrência' },
                  { id: 'pontos_lancamentos', label: '2. pontos_lancamentos', badge: 'Ledger Imutável' },
                  { id: 'pontos_solicitacoes', label: '3. pontos_solicitacoes', badge: 'Alçadas & PIX' },
                  { id: 'pontos_conta_mae', label: '4. pontos_conta_mae', badge: 'Conta Mãe CNPJ' },
                ].map((tbl) => (
                  <button
                    key={tbl.id}
                    onClick={() => setSelectedTableTab(tbl.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      selectedTableTab === tbl.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tbl.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        selectedTableTab === tbl.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tbl.badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Detalhes da Tabela Selecionada */}
              {(() => {
                const currentTable = (schemaData?.tables || []).find(
                  (t: any) => t.name === selectedTableTab
                );
                if (!currentTable) {
                  return (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      Carregando metadados da tabela...
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Cabeçalho da Tabela */}
                    <div className="p-5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-base font-extrabold text-slate-900">
                            {currentTable.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                            PK: {currentTable.primaryKey}
                          </span>
                          {currentTable.immutable && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Imutável (Append-Only)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{currentTable.description}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>{currentTable.columns.length} colunas</span>
                        <span>•</span>
                        <span>{currentTable.indexes.length} índices</span>
                        <span>•</span>
                        <span>{currentTable.triggers.length} triggers</span>
                      </div>
                    </div>

                    {/* Dicionário de Colunas */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Coluna</th>
                            <th className="py-3 px-4">Tipo SQL</th>
                            <th className="py-3 px-4">Nulabilidade</th>
                            <th className="py-3 px-4">Padrão (Default)</th>
                            <th className="py-3 px-4">Constraints & Restrições</th>
                            <th className="py-3 px-4">Finalidade no Negócio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentTable.columns.map((col: any) => (
                            <tr key={col.name} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{col.name}</span>
                                {col.isPrimaryKey && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                    PK
                                  </span>
                                )}
                                {col.isUnique && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                                    UNIQUE
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                                {col.type}
                              </td>
                              <td className="py-3 px-4">
                                {col.isNullable ? (
                                  <span className="text-slate-400">NULL</span>
                                ) : (
                                  <span className="font-bold text-slate-700">NOT NULL</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                {col.defaultValue || '—'}
                              </td>
                              <td className="py-3 px-4">
                                {col.constraints && col.constraints.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {col.constraints.map((c: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Índices & Triggers da Tabela */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Índices de Otimização:</span>
                        </h5>
                        <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                          {currentTable.indexes.map((idx: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span>{idx}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Triggers de Integridade:</span>
                        </h5>
                        <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                          {currentTable.triggers && currentTable.triggers.length > 0 ? (
                            currentTable.triggers.map((trg: string, i: number) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>{trg}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400">Nenhuma trigger adicional cadastrada.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODO 2: SCRIPT DDL SQL COMPLETO */}
          {schemaViewMode === 'sql' && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    src/server/db/schema.sql — PostgreSQL 14+ / ANSI SQL
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
                  >
                    {copiedSql ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed no-scrollbar select-text">
                <pre>{schemaData?.rawSql || '-- Carregando script DDL SQL...'}</pre>
              </div>
            </div>
          )}

          {/* MODO 3: MATRIZ DE GOVERNANÇA & REGRAS ACID */}
          {schemaViewMode === 'constraints' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  titulo: '1. Trava de Não-Negatividade',
                  descricao:
                    'Restrição CHECK (saldo >= 0.00) aplicada em saldo_disponivel, saldo_bloqueado e saldo_processamento. O banco de dados rejeita no nível de engine qualquer tentativa de deixar saldos negativos.',
                  tag: 'chk_saldo_nao_negativo',
                  badge: 'Integridade Absoluta',
                  icon: ShieldCheck,
                  cor: 'emerald',
                },
                {
                  titulo: '2. Ledger Imutável (Append-Only)',
                  descricao:
                    'Trigger trg_proteger_pontos_lancamentos intercepta qualquer comando UPDATE ou DELETE em pontos_lancamentos e aborta imediatamente com RAISE EXCEPTION. Mutações só ocorrem via novos lançamentos compensatórios.',
                  tag: 'fn_proteger_ledger_imutavel',
                  badge: 'Compliance Probatório',
                  icon: Lock,
                  cor: 'rose',
                },
                {
                  titulo: '3. Concorrência Otimista Atômica',
                  descricao:
                    'Contador sequencial saldo_version incrementado a cada transação ACID. Se duas requisições tentarem atualizar a mesma carteira simultaneamente, a segunda é abortada por colisão de versão.',
                  tag: 'saldo_version + 1',
                  badge: 'Anti Race Condition',
                  icon: RefreshCw,
                  cor: 'blue',
                },
                {
                  titulo: '4. Blindagem por Idempotência',
                  descricao:
                    'Índices UNIQUE em idempotency_key e transaction_id nas tabelas pontos_lancamentos e pontos_solicitacoes. Tentativas de reprocessamento por duplo clique ou retry de webhooks são ignoradas com segurança.',
                  tag: 'idempotency_key UNIQUE',
                  badge: 'Zero Duplicidade',
                  icon: FileCheck,
                  cor: 'amber',
                },
                {
                  titulo: '5. Conciliação Matemática Universal',
                  descricao:
                    'Fórmula contínua: Saldo Conta Mãe = Σ(Disponível) + Σ(Bloqueado) + Σ(Processamento) + Σ(Cartões). Qualquer discrepância ativa Alerta Nível 5 e bloqueia novas operações.',
                  tag: 'Conciliação em 100%',
                  badge: 'Conta Mãe CNPJ',
                  icon: Building2,
                  cor: 'indigo',
                },
                {
                  titulo: '6. Rastreabilidade de Alçadas',
                  descricao:
                    'Matriz multinível de alçadas configurada por faixas de valor (Automática até R$ 500; Supervisor até R$ 5.000; Gerente até R$ 20.000; Diretor acima de R$ 20.000), gravando decisões em JSONB imutável.',
                  tag: 'Alçadas Multinível',
                  badge: 'Governança Bancária',
                  icon: UserCheck,
                  cor: 'slate',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {item.badge}
                        </span>
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.titulo}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.descricao}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-indigo-700">
                      <span>Constraint:</span>
                      <span className="font-bold">{item.tag}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Decisão de Aprovação */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Confirmar Decisão de Alçada ({decisionModal.decision.toUpperCase()})
              </h3>
              <button
                onClick={() => setDecisionModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Solicitante:</strong> {decisionModal.request.usuario_nome}
              </p>
              <p>
                <strong>Valor em Reais:</strong> R${' '}
                {decisionModal.request.valor_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p>
                <strong>Aprovador Atual:</strong> {currentUser.name || currentUser.username} (
                {currentUser.role})
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Justificativa / Parecer da Decisão:
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Informe o motivo para registro no ledger auditável..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={processingDecision}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  decisionModal.decision === 'aprovado'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processingDecision ? 'Registrando...' : `Confirmar ${decisionModal.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
