import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Filter,
  User,
  Ticket,
  Receipt,
  Download,
  Building2,
  Sparkles,
  RefreshCw,
  X,
  CreditCard,
  Percent,
  Check,
  ChevronRight,
  ArrowRight,
  Printer,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Partner, Offer, CouponValidation, PartnerPOSStats, AdminUser } from '../../types';
import { api } from '../../services/api';

interface PartnerPortalValidatorViewProps {
  currentUser?: AdminUser;
}

export const PartnerPortalValidatorView: React.FC<PartnerPortalValidatorViewProps> = ({
  currentUser,
}) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('todos');
  const [validations, setValidations] = useState<CouponValidation[]>([]);
  const [stats, setStats] = useState<PartnerPOSStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Input states for validation POS
  const [couponInput, setCouponInput] = useState('');
  const [billAmountInput, setBillAmountInput] = useState<string>('120.00');
  const [pointsUsedInput, setPointsUsedInput] = useState<string>('0');
  const [operatorName, setOperatorName] = useState(currentUser?.name || 'Caixa Balcão #1');
  const [notesInput, setNotesInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<{
    validation: CouponValidation;
    message: string;
    discountAmount: number;
    netPaid: number;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Selected validation modal for receipt/details
  const [receiptModal, setReceiptModal] = useState<CouponValidation | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadValidationsAndStats();
  }, [selectedPartnerId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pts, ofs] = await Promise.all([api.getPartners(), api.getOffers()]);
      setPartners(pts);
      setOffers(ofs.offers || []);
      if (pts.length > 0 && selectedPartnerId === 'todos') {
        setSelectedPartnerId('part_outback'); // Default friendly partner for quick testing
      }
    } catch (err) {
      console.error('Erro ao carregar parceiros no terminal POS:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadValidationsAndStats = async () => {
    try {
      const [vals, st] = await Promise.all([
        api.getValidations({ partnerId: selectedPartnerId }),
        api.getPartnerPOSStats(selectedPartnerId),
      ]);
      setValidations(vals);
      setStats(st);
    } catch (err) {
      console.error('Erro ao atualizar validações:', err);
    }
  };

  // Matched offer preview while typing coupon
  const matchedOffer = useMemo(() => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean || clean.length < 3) return null;
    return offers.find((o) => o.couponCode.toUpperCase() === clean) || null;
  }, [couponInput, offers]);

  // Real-time calculation of discount preview
  const calculationPreview = useMemo(() => {
    const bill = parseFloat(billAmountInput) || 0;
    const points = parseInt(pointsUsedInput, 10) || 0;
    let discount = 0;

    if (matchedOffer) {
      if (matchedOffer.discountType === 'percentage') {
        const numMatch = matchedOffer.discountValue.match(/(\d+)/);
        const pct = numMatch ? parseFloat(numMatch[1]) / 100 : 0.15;
        discount = bill * pct;
      } else if (matchedOffer.discountType === 'fixed') {
        const numMatch = matchedOffer.discountValue.match(/(\d+[\.,]?\d*)/);
        discount = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 20.0;
        if (discount > bill) discount = bill;
      } else {
        discount = bill * 0.15;
      }
    }

    const totalDiscount = Math.min(bill, discount + points * 1.0);
    const netPaid = Math.max(0, bill - totalDiscount);

    return {
      bill,
      discount,
      pointsDiscount: points * 1.0,
      totalDiscount,
      netPaid,
    };
  }, [billAmountInput, pointsUsedInput, matchedOffer]);

  const handleValidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      setValidationError('Por favor, informe ou bipe o código do cupom.');
      return;
    }

    setValidating(true);
    setValidationError(null);
    setValidationSuccess(null);

    try {
      const res = await api.validateCouponPOS({
        couponCode: couponInput.trim(),
        partnerId: selectedPartnerId,
        billAmount: parseFloat(billAmountInput) || 100,
        pointsUsed: parseInt(pointsUsedInput, 10) || 0,
        operatorName,
        notes: notesInput,
      });

      setValidationSuccess({
        validation: res.validation,
        message: res.message,
        discountAmount: res.discountAmount,
        netPaid: res.netPaid,
      });

      // Confetti celebration for successful validation
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}

      // Reset form
      setCouponInput('');
      setNotesInput('');
      loadValidationsAndStats();
    } catch (err: any) {
      setValidationError(err.message || 'Falha ao validar cupom.');
    } finally {
      setValidating(false);
    }
  };

  const handleCancelValidation = async (id: string) => {
    if (!window.confirm('Deseja realmente estornar esta validação? O cupom voltará a ficar disponível.')) {
      return;
    }
    try {
      await api.cancelValidation(id);
      loadValidationsAndStats();
    } catch (err: any) {
      alert(err.message || 'Falha ao estornar validação.');
    }
  };

  const currentPartner = partners.find((p) => p.id === selectedPartnerId);

  // Filtered validations list
  const filteredValidations = validations.filter((v) => {
    if (statusFilter !== 'todos' && v.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        v.couponCode.toLowerCase().includes(q) ||
        v.customerName.toLowerCase().includes(q) ||
        v.offerTitle.toLowerCase().includes(q) ||
        v.validatedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - Fase 12 */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Fase 12 — Portal do Lojista & Terminal de Atendimento (POS)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
              Validador de Cupons & Pontos do Estabelecimento
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Interface oficial para o operador de caixa e atendente dos estabelecimentos parceiros.
              Valide cupons em tempo real, registre o valor consumido, aplique descontos na mesa e
              alimente automaticamente a Clearing House de repasses financeiros.
            </p>
          </div>

          {/* Partner Selector Dropdown */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 min-w-[280px]">
            <label className="block text-[11px] font-semibold text-blue-200 uppercase tracking-wider mb-1">
              Estabelecimento Selecionado:
            </label>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              >
                <option value="todos">🌐 Todos os Parceiros (Visão Central)</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Validações Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            {stats?.validationsToday || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total do mês: <strong className="text-slate-800">{stats?.totalValidationsMonth || 0} cupons</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Volume Consumido Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            R$ {(stats?.grossVolumeToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            Faturamento bruto gerado pelos membros
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Descontos Aplicados Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            R$ {(stats?.discountGivenToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-600 mt-1 font-medium">
            Economia garantida aos associados
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Repasse Pendente (Clearing)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-heading">
            R$ {(stats?.pendingSettlementAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">
            A liquidar no próximo fechamento quinzenal
          </p>
        </div>
      </div>

      {/* Main Grid: POS Terminal on Left (60%), History Feed on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= TERMINAL POS DE ATENDIMENTO ================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Caixa de Validação de Cupons & Vouchers
                </h2>
                <p className="text-xs text-slate-500">
                  Operador: <strong className="text-slate-800">{operatorName}</strong> • {currentPartner?.name || 'Visão Global'}
                </p>
              </div>
            </div>

            {/* Quick Chips of popular active coupons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Exemplos:</span>
              {['VTX-OUTBACK26', 'VTX-SPOLETO', 'VTX-DROGASIL'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouponInput(c)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Form */}
          <form onSubmit={handleValidateSubmit} className="space-y-4">
            {/* Coupon Code Input Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código do Cupom / Voucher do Cliente:
              </label>
              <div className="relative">
                <Ticket className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setValidationError(null);
                    setValidationSuccess(null);
                  }}
                  placeholder="Ex: VTX-OUTBACK26 (ou use leitor de QR Code)"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Matched Offer Preview Card if coupon is recognized */}
            {matchedOffer && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 animate-fadeIn space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" /> CUPOM VÁLIDO & ATIVO
                    </span>
                    <span className="text-xs font-semibold text-blue-900">
                      {matchedOffer.partnerName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                    {matchedOffer.discountValue}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {matchedOffer.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {matchedOffer.terms || matchedOffer.description}
                </p>
              </div>
            )}

            {/* Bill Amount & Points Used */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Valor Total da Conta (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={billAmountInput}
                    onChange={(e) => setBillAmountInput(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pontos VTXMais Abatidos:
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    value={pointsUsedInput}
                    onChange={(e) => setPointsUsedInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  1 ponto = R$ 1,00 de abatimento direto
                </span>
              </div>
            </div>

            {/* Operator and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome do Atendente / Garçom:
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Ex: João (Mesa #4)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observação / Itens Consumidos:
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: 2 pratos principais + sobremesa"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            {/* Real-Time Mathematical Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal da Conta:</span>
                <span className="font-semibold text-slate-800">
                  R$ {calculationPreview.bill.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Desconto Clube VTXMais:
                </span>
                <span className="font-bold">
                  - R$ {calculationPreview.discount.toFixed(2)}
                </span>
              </div>
              {calculationPreview.pointsDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Pontos Resgatados:</span>
                  <span className="font-bold">
                    - R$ {calculationPreview.pointsDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Valor Líquido a Cobrar do Cliente:
                </span>
                <span className="text-lg font-black text-blue-700 font-heading">
                  R$ {calculationPreview.netPaid.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Feedback Messages */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {validationSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{validationSuccess.message}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-emerald-700">
                  <span>Cliente: {validationSuccess.validation.customerName}</span>
                  <button
                    type="button"
                    onClick={() => setReceiptModal(validationSuccess.validation)}
                    className="font-bold underline hover:text-emerald-900 cursor-pointer"
                  >
                    Ver Comprovante Oficial
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={validating}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {validating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando no Servidor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Confirmar Consumo & Validar Cupom (POS)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ================= FEED HISTÓRICO DE VALIDAÇÕES ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Histórico em Tempo Real
              </h3>
              <p className="text-[11px] text-slate-500">
                Últimos cupons processados no estabelecimento
              </p>
            </div>
            <button
              type="button"
              onClick={loadValidationsAndStats}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Atualizar feed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search and Status filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, cupom..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="todos">Todos</option>
              <option value="confirmado">Confirmados</option>
              <option value="estornado">Estornados</option>
            </select>
          </div>

          {/* Validations list feed */}
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredValidations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhuma validação encontrada com os filtros selecionados.
              </div>
            ) : (
              filteredValidations.map((v) => (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    v.status === 'estornado'
                      ? 'bg-rose-50/50 border-rose-200 opacity-60'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {v.couponCode}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.validatedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {v.offerTitle}
                  </h5>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Membro: <strong className="text-slate-700">{v.customerName}</strong></span>
                    <span className="text-emerald-700 font-bold">
                      Desc: R$ {v.discountApplied.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 truncate max-w-[150px]">
                      Por: {v.validatedBy}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptModal(v)}
                        className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        Recibo
                      </button>
                      {v.status === 'confirmado' && (
                        <button
                          type="button"
                          onClick={() => handleCancelValidation(v.id)}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer"
                          title="Estornar validação"
                        >
                          Estornar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL DE RECIBO / COMPROVANTE OFICIAL ================= */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <button
              onClick={() => setReceiptModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Comprovante de Consumo & Cupom
              </h3>
              <p className="text-xs text-slate-500">
                Clube VTXMais de Benefícios • Validador POS
              </p>
              <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
                STATUS: {receiptModal.status.toUpperCase()}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cupom:</span>
                <span className="font-bold text-slate-900">{receiptModal.couponCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Estabelecimento:</span>
                <span className="font-bold text-slate-900">{receiptModal.partnerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Membro Associado:</span>
                <span className="font-bold text-slate-900">{receiptModal.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Data e Hora:</span>
                <span className="text-slate-800">
                  {new Date(receiptModal.validatedAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Atendente / Caixa:</span>
                <span className="text-slate-800">{receiptModal.validatedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Valor Bruto da Conta:</span>
                <span className="text-slate-900 font-bold">
                  R$ {receiptModal.billAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                <span>Desconto Concedido:</span>
                <span className="font-bold">- R$ {receiptModal.discountApplied.toFixed(2)}</span>
              </div>
              {receiptModal.pointsUsed > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                  <span>Pontos VTXMais Usados:</span>
                  <span className="font-bold">{receiptModal.pointsUsed} pts</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm border-t-2 border-slate-900 font-bold text-slate-900">
                <span>Total Pago pelo Membro:</span>
                <span>R$ {receiptModal.netAmountPaid.toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt Footer Action */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
