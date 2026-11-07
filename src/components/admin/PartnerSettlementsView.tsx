import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Download,
  Printer,
  X,
  RefreshCw,
  Plus,
  Percent,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PartnerSettlement, Partner, AdminUser, SettlementStatus } from '../../types';
import { api, pointsService } from '../../services/api';

interface PartnerSettlementsViewProps {
  currentUser?: AdminUser;
}

export const PartnerSettlementsView: React.FC<PartnerSettlementsViewProps> = ({
  currentUser,
}) => {
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate Batch modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genPartnerId, setGenPartnerId] = useState('');
  const [genPeriodStart, setGenPeriodStart] = useState(
    new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10)
  );
  const [genPeriodEnd, setGenPeriodEnd] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [generating, setGenerating] = useState(false);

  // Settlement Detail & Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState<PartnerSettlement | null>(null);

  // Settle Payout Modal
  const [settleModal, setSettleModal] = useState<PartnerSettlement | null>(null);
  const [settling, setSettling] = useState(false);
  const [pixSuccessMsg, setPixSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sets, pts] = await Promise.all([
        api.getSettlements(),
        api.getPartners(),
      ]);
      setSettlements(sets);
      setPartners(pts);
      if (pts.length > 0 && !genPartnerId) {
        setGenPartnerId(pts[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar clearing house:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPartnerId) return;

    setGenerating(true);
    try {
      const res = await api.generateSettlement({
        partnerId: genPartnerId,
        periodStart: genPeriodStart,
        periodEnd: genPeriodEnd,
      });

      setSettlements((prev) => [res.settlement, ...prev]);
      setShowGenerateModal(false);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981'],
        });
      } catch {}
    } catch (err: any) {
      alert(err.message || 'Falha ao gerar fechamento.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecuteSettlePayout = async () => {
    if (!settleModal) return;

    setSettling(true);
    setPixSuccessMsg(null);

    try {
      const approverName = currentUser?.name || 'Diretor Financeiro VTXMais';
      const res = await api.settlePayout(settleModal.id, approverName);

      setSettlements((prev) =>
        prev.map((s) => (s.id === settleModal.id ? res.settlement : s))
      );
      setSettleModal(res.settlement);
      setPixSuccessMsg(
        `Repasse liquidado com sucesso! Chave PIX: ${settleModal.partnerPixKey} | TxID: ${res.settlement.pixTransactionId}`
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}
    } catch (err: any) {
      alert(err.message || 'Falha ao liquidar repasse.');
    } finally {
      setSettling(false);
    }
  };

  // Executive KPI summary calculations
  const summaryKpis = useMemo(() => {
    const totalGross = settlements.reduce((acc, s) => acc + (s.grossVolumeBrl || 0), 0);
    const totalCommission = settlements.reduce((acc, s) => acc + (s.clubCommissionBrl || 0), 0);
    const pendingSettlement = settlements
      .filter((s) => s.status !== 'liquidado_pix' && s.status !== 'cancelado')
      .reduce((acc, s) => acc + (s.netPayoutBrl || 0), 0);
    const totalLiquidated = settlements
      .filter((s) => s.status === 'liquidado_pix')
      .reduce((acc, s) => acc + (s.netPayoutBrl || 0), 0);

    return {
      totalGross,
      totalCommission,
      pendingSettlement,
      totalLiquidated,
      totalSettlements: settlements.length,
    };
  }, [settlements]);

  // Filtered list
  const filteredSettlements = settlements.filter((s) => {
    if (selectedPartnerId !== 'todos' && s.partnerId !== selectedPartnerId) return false;
    if (selectedStatus !== 'todos' && s.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.partnerName.toLowerCase().includes(q) ||
        s.partnerCnpj.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - Fase 12 Clearing House */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Receipt className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fase 12 — Clearing House B2B & Repasses Financeiros aos Lojistas</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
              Gestão de Repasses & Faturas Periódicas dos Parceiros
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Cálculo contábil automatizado do volume consumido pelos membros, comissão retida pelo
              Clube VTXMais (take-rate), ressarcimento de pontos pagos pelos associados e liquidação
              em lote com emissão de comprovantes oficiais e débito na Conta Mãe.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Fechamento de Lote</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GMV Bruto Transacionado
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            R$ {summaryKpis.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total movimentado nas lojas parceiras
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Comissão Clube VTXMais
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            R$ {summaryKpis.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-600 mt-1 font-medium">
            Receita líquida retida pela plataforma
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Repasses Pendentes
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 font-heading">
            R$ {summaryKpis.pendingSettlement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">
            Aguardando aprovação ou envio via PIX
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Liquidado via PIX
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-heading">
            R$ {summaryKpis.totalLiquidated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            Repassado com conciliação bancária
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por lote, parceiro ou CNPJ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="todos">Todos os Parceiros</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="todos">Todos os Status</option>
            <option value="fechado">Fechado (Aguardando Aprovação)</option>
            <option value="aprovado">Aprovado (Pronto para PIX)</option>
            <option value="liquidado_pix">Liquidado via PIX</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Lote / Fatura</th>
                <th className="py-3.5 px-4">Estabelecimento</th>
                <th className="py-3.5 px-4">Período</th>
                <th className="py-3.5 px-4 text-center">Cupons</th>
                <th className="py-3.5 px-4 text-right">Volume Bruto</th>
                <th className="py-3.5 px-4 text-right">Comissão Clube</th>
                <th className="py-3.5 px-4 text-right">Reembolso Pts</th>
                <th className="py-3.5 px-4 text-right">Valor Líquido</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhum fechamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {s.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.partnerName}</div>
                      <div className="text-[10px] text-slate-400">{s.partnerCnpj}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {s.periodStart} a {s.periodEnd}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {s.totalValidations}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      R$ {s.grossVolumeBrl.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-700 font-semibold">
                      - R$ {s.clubCommissionBrl.toFixed(2)} ({((s.clubCommissionRate || 0.1) * 100).toFixed(0)}%)
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-700 font-semibold">
                      + R$ {s.pointsReimbursementBrl.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      R$ {s.netPayoutBrl.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'liquidado_pix'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'aprovado'
                            ? 'bg-blue-100 text-blue-800'
                            : s.status === 'fechado'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status === 'liquidado_pix'
                          ? 'LIQUIDADO PIX'
                          : s.status === 'aprovado'
                          ? 'APROVADO'
                          : s.status === 'fechado'
                          ? 'FECHADO'
                          : s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveInvoice(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Extrato
                        </button>
                        {s.status !== 'liquidado_pix' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettleModal(s);
                              setPixSuccessMsg(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            Pagar PIX
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DE GERAR NOVO FECHAMENTO ================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Gerar Fechamento de Fatura (Clearing)
              </h3>
              <p className="text-xs text-slate-500">
                Consolida as validações de cupons do período e calcula o repasse líquido devido.
              </p>
            </div>

            <form onSubmit={handleGenerateSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Estabelecimento Parceiro:
                </label>
                <select
                  value={genPartnerId}
                  onChange={(e) => setGenPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Início do Período:
                  </label>
                  <input
                    type="date"
                    value={genPeriodStart}
                    onChange={(e) => setGenPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Fim do Período:
                  </label>
                  <input
                    type="date"
                    value={genPeriodEnd}
                    onChange={(e) => setGenPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Regras de Liquidação Financeira:
                </div>
                <p className="text-[11px] leading-relaxed">
                  O sistema calculará automaticamente o somatório dos cupons consumidos, deduzirá a
                  comissão contratual do Clube (ex: 8% a 10%) e somará os créditos de pontos
                  VTXMais utilizados.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gerando Fatura...</span>
                    </>
                  ) : (
                    <span>Emitir Fechamento do Parceiro</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE EXTRATO & FATURA ================= */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Invoice Header */}
            <div className="border-b border-slate-200 pb-4 space-y-1 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Extrato Financeiro Oficial de Clearing
              </span>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                FATURA DE REPASSE: {activeInvoice.id}
              </h3>
              <p className="text-xs text-slate-500">
                Clube VTXMais de Benefícios • Fechamento Periódico
              </p>
            </div>

            {/* Partner & Settlement Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Parceiro Beneficiário:</span>
                <span className="font-bold text-slate-900">{activeInvoice.partnerName}</span>
                <span className="text-slate-500 block text-[11px]">{activeInvoice.partnerCnpj}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Chave PIX Cadastrada:</span>
                <span className="font-mono font-bold text-blue-700">{activeInvoice.partnerPixKey}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Período de Apuração:</span>
                <span className="font-semibold text-slate-800">
                  {activeInvoice.periodStart} a {activeInvoice.periodEnd}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status de Liquidação:</span>
                <span className="font-bold text-emerald-700 uppercase">{activeInvoice.status}</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs border border-slate-200 rounded-2xl p-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total de Cupons Validados:</span>
                <span className="font-bold text-slate-900">{activeInvoice.totalValidations} cupons</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Volume Bruto de Consumo (GMV):</span>
                <span className="font-bold text-slate-900">
                  R$ {activeInvoice.grossVolumeBrl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-purple-700">
                <span>Comissão de Intermediação Clube VTXMais ({((activeInvoice.clubCommissionRate || 0.1) * 100).toFixed(0)}%):</span>
                <span className="font-bold">- R$ {activeInvoice.clubCommissionBrl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                <span>Reembolso de Pontos Utilizados pelos Membros:</span>
                <span className="font-bold">+ R$ {activeInvoice.pointsReimbursementBrl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                <span>VALOR LÍQUIDO A REPASSAR:</span>
                <span className="text-lg font-black text-blue-700 font-heading">
                  R$ {activeInvoice.netPayoutBrl.toFixed(2)}
                </span>
              </div>
            </div>

            {/* PIX Execution Meta if settled */}
            {activeInvoice.pixTransactionId && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1 font-mono">
                <div className="font-bold text-[11px] uppercase">Comprovante de Transferência PIX:</div>
                <div>TxID: {activeInvoice.pixTransactionId}</div>
                <div>Liquidado por: {activeInvoice.settledBy}</div>
                <div>Data: {activeInvoice.settledAt && new Date(activeInvoice.settledAt).toLocaleString('pt-BR')}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Fatura</span>
              </button>
              {activeInvoice.status !== 'liquidado_pix' && (
                <button
                  type="button"
                  onClick={() => {
                    setSettleModal(activeInvoice);
                    setActiveInvoice(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Pagar Agora via PIX
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE LIQUIDAÇÃO VIA PIX CONTA MÃE ================= */}
      {settleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <button
              onClick={() => setSettleModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Liquidar Repasse via PIX Conta Mãe
              </h3>
              <p className="text-xs text-slate-500">
                Fatura {settleModal.id} • {settleModal.partnerName}
              </p>
            </div>

            {pixSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Transferência PIX Concluída com Sucesso!</span>
                </div>
                <p className="text-[11px] leading-relaxed font-mono">{pixSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setSettleModal(null)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Concluir & Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiário:</span>
                    <span className="font-bold text-slate-900">{settleModal.partnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chave PIX Destino:</span>
                    <span className="font-mono font-bold text-blue-700">{settleModal.partnerPixKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Banco de Origem:</span>
                    <span className="font-semibold text-slate-800">341 - Itaú Unibanco (Conta Mãe)</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Valor Líquido a Transferir:</span>
                    <span className="text-emerald-700 text-base font-black">
                      R$ {settleModal.netPayoutBrl.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Esta ação debitará contabilmente o saldo da Conta Mãe e atualizará o status da fatura para Liquidado.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteSettlePayout}
                    disabled={settling}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {settling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando PIX ACID...</span>
                      </>
                    ) : (
                      <span>Autorizar & Enviar PIX</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleModal(null)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
