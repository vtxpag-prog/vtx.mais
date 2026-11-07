import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminUser, Offer } from '../../types';
import { userCouponsService, RedeemedUserCoupon, CouponValidityStatus, api } from '../../services/api';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Copy,
  Check,
  QrCode,
  Calendar,
  Building2,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Wallet,
  ShoppingBag,
  Info,
  X,
  Printer,
  Star,
  Send,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoucherAchievementsBanner } from './VoucherAchievementsBanner';

interface VoucherHistoryViewProps {
  currentUser: AdminUser;
  onExploreOffers?: () => void;
}

export const VoucherHistoryView: React.FC<VoucherHistoryViewProps> = ({
  currentUser,
  onExploreOffers,
}) => {
  const userKey = currentUser?.username || currentUser?.email || currentUser?.id || 'admin';
  const [coupons, setCoupons] = useState<RedeemedUserCoupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | CouponValidityStatus>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'recent' | 'expiry' | 'savings'>('recent');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<RedeemedUserCoupon | null>(null);

  // Post-redemption review state for modal
  const [modalRating, setModalRating] = useState<number>(5);
  const [modalHoverRating, setModalHoverRating] = useState<number>(0);
  const [modalComment, setModalComment] = useState<string>('');
  const [submittingModalRating, setSubmittingModalRating] = useState<boolean>(false);
  const [modalReviewSubmitted, setModalReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    loadCoupons();
  }, [userKey]);

  const loadCoupons = () => {
    const list = userCouponsService.getRedeemedCoupons(userKey);
    setCoupons(list);
  };

  const handleOpenVoucherModal = (c: RedeemedUserCoupon) => {
    setViewingVoucher(c);
    setModalRating(5);
    setModalHoverRating(0);
    setModalComment('');
    setSubmittingModalRating(false);
    setModalReviewSubmitted(false);
  };

  const handleSubmitVoucherRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingVoucher) return;
    try {
      setSubmittingModalRating(true);
      await api.submitReview({
        offerId: viewingVoucher.offerId,
        rating: modalRating,
        comment: modalComment.trim(),
        userName: currentUser?.name || currentUser?.username || 'Associado VTXMais',
        userEmail: currentUser?.email,
        couponCode: viewingVoucher.couponCode,
        verifiedRedemption: true,
      });
      setModalReviewSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar avaliação.');
    } finally {
      setSubmittingModalRating(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleUsed = (couponId: string) => {
    const updated = userCouponsService.toggleCouponUsed(userKey, couponId);
    setCoupons(updated);

    const target = updated.find((c) => c.id === couponId);
    if (target && target.status === 'utilizado') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {}
    }
  };

  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Grouping & metrics
  const validityGroups = useMemo(() => {
    let validos = 0;
    let expirando = 0;
    let utilizados = 0;
    let expirados = 0;

    coupons.forEach((c) => {
      const info = userCouponsService.getValidityInfo(c);
      if (info.status === 'utilizado') utilizados++;
      else if (info.status === 'expirado') expirados++;
      else if (info.status === 'expirando') expirando++;
      else validos++;
    });

    return { validos, expirando, utilizados, expirados, total: coupons.length };
  }, [coupons]);

  const totalSaved = useMemo(() => {
    return userCouponsService.calculateTotalSavings(coupons);
  }, [coupons]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    coupons.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [coupons]);

  // Filter and sort
  const filteredCoupons = useMemo(() => {
    return coupons
      .filter((c) => {
        const info = userCouponsService.getValidityInfo(c);
        
        // Status filter
        if (selectedStatusFilter !== 'todos') {
          if (selectedStatusFilter === 'valido' && info.status !== 'valido') return false;
          if (selectedStatusFilter === 'expirando' && info.status !== 'expirando') return false;
          if (selectedStatusFilter === 'utilizado' && info.status !== 'utilizado') return false;
          if (selectedStatusFilter === 'expirado' && info.status !== 'expirado') return false;
        }

        // Category filter
        if (selectedCategory !== 'todas' && c.category !== selectedCategory) {
          return false;
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = c.offerTitle?.toLowerCase().includes(q);
          const matchPartner = c.partnerName?.toLowerCase().includes(q);
          const matchCode = c.couponCode?.toLowerCase().includes(q);
          const matchDiscount = c.discountValue?.toLowerCase().includes(q);
          if (!matchTitle && !matchPartner && !matchCode && !matchDiscount) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'savings') return (b.calculatedSavings || 0) - (a.calculatedSavings || 0);
        if (sortBy === 'expiry') {
          const expA = new Date(a.validUntil || '2099-01-01').getTime();
          const expB = new Date(b.validUntil || '2099-01-01').getTime();
          return expA - expB;
        }
        return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime();
      });
  }, [coupons, searchQuery, selectedStatusFilter, selectedCategory, sortBy]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Histórico de Vouchers & Cupons
              </h2>
              <span className="text-xs text-slate-500">
                Acompanhe a validade e gerencie todos os cupons resgatados da sua conta
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onExploreOffers && (
            <button
              onClick={onExploreOffers}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Resgatar Novos Cupons</span>
            </button>
          )}
          <button
            onClick={loadCoupons}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Atualizar lista de cupons"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sistema Integrado de Conquistas & Emblemas (Gamificação por Quantidade de Cupons) */}
      <VoucherAchievementsBanner
        coupons={coupons}
        totalSavings={totalSaved}
        currentUser={currentUser}
        onExploreOffers={onExploreOffers}
      />

      {/* KPI Cards: Validity & Savings Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Redeemed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 space-y-1 shadow-2xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Resgatado</span>
            <Ticket className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {validityGroups.total}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Cupons acumulados</div>
        </div>

        {/* Active & Ready */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-1 shadow-2xs">
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Válidos & Ativos</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-heading">
            {validityGroups.validos}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Prontos para uso</div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/90 space-y-1 shadow-2xs">
          <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Expirando Breve</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-heading">
            {validityGroups.expirando}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">Vencem em até 4 dias</div>
        </div>

        {/* Used */}
        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 space-y-1 shadow-2xs">
          <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Já Utilizados</span>
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-heading">
            {validityGroups.utilizados}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">Economias realizadas</div>
        </div>

        {/* Total Economy */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-slate-800 space-y-1 shadow-md col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Economia Total</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-heading truncate">
            {formatBRL(totalSaved)}
          </div>
          <div className="text-[11px] text-slate-300">Poupados no clube</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {[
            { id: 'todos', label: 'Todos os Cupons', count: validityGroups.total },
            { id: 'valido', label: '🟢 Válidos', count: validityGroups.validos },
            { id: 'expirando', label: '⏳ Expirando em Breve', count: validityGroups.expirando },
            { id: 'utilizado', label: '🛍️ Já Utilizados', count: validityGroups.utilizados },
            { id: 'expirado', label: '🔴 Expirados', count: validityGroups.expirados },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedStatusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Category, and Sorting Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por loja, título da oferta, código do voucher..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Select */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="recent">Mais Recentes Primeiro</option>
            <option value="expiry">Vencimento Mais Próximo</option>
            <option value="savings">Maior Economia em R$</option>
          </select>
        </div>
      </div>

      {/* Vouchers Grid List */}
      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const validity = userCouponsService.getValidityInfo(coupon);
            const isCopied = copiedId === coupon.id;

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                  validity.status === 'expirado'
                    ? 'border-slate-200 opacity-60'
                    : validity.status === 'expirando'
                    ? 'border-amber-300 ring-1 ring-amber-300/40'
                    : 'border-slate-200/90 hover:border-blue-400'
                }`}
              >
                {/* Top Card Section */}
                <div className="p-5 space-y-4">
                  {/* Partner & Category Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {coupon.partnerLogo ? (
                        <img
                          src={coupon.partnerLogo}
                          alt={coupon.partnerName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                          {coupon.partnerName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate font-heading">
                          {coupon.partnerName}
                        </h4>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <Tag className="w-3 h-3 text-blue-500" />
                          <span>{coupon.category}</span>
                        </span>
                      </div>
                    </div>

                    {/* Validity & Gamification Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${validity.badgeClass}`}
                      >
                        {validity.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                        <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>Soma Conquista</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Discount Value */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {coupon.offerTitle}
                    </div>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-base font-black text-emerald-600 font-heading">
                        {coupon.discountValue}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (~{formatBRL(coupon.calculatedSavings)} economizados)
                      </span>
                    </div>
                  </div>

                  {/* Coupon Code Box */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Código do Voucher:</span>
                      <span className="text-slate-400">{coupon.voucherType === 'presencial' ? 'Loja Física' : 'Online'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                        {coupon.couponCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.id, coupon.couponCode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Validity and Redemption Dates */}
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Resgatado em:</span>
                      </span>
                      <span className="font-medium text-slate-700">
                        {new Date(coupon.redeemedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Data limite de uso:</span>
                      </span>
                      <span className="font-medium text-slate-700">
                        {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenVoucherModal(coupon)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ver Voucher / QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleUsed(coupon.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                      coupon.status === 'utilizado'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title={coupon.status === 'utilizado' ? 'Clique para marcar como não utilizado' : 'Clique para marcar como já utilizado'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{coupon.status === 'utilizado' ? 'Utilizado' : 'Marcar Uso'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Nenhum voucher encontrado com os filtros selecionados
            </h3>
            <p className="text-xs text-slate-500">
              Tente alterar os termos de busca, limpar os filtros de status ou explorar novos cupons do clube.
            </p>
          </div>
          {onExploreOffers && (
            <button
              onClick={onExploreOffers}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
            >
              Explorar Ofertas Disponíveis
            </button>
          )}
        </div>
      )}

      {/* MODAL: Full Digital Voucher / QR Code Presentation */}
      <AnimatePresence>
        {viewingVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setViewingVoucher(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative z-10 bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm font-heading">
                    Voucher Oficial de Benefício VTXMais
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingVoucher(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Voucher Body (Ticket Design) */}
            <div className="p-6 space-y-5">
              {/* Partner info */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                {viewingVoucher.partnerLogo ? (
                  <img
                    src={viewingVoucher.partnerLogo}
                    alt={viewingVoucher.partnerName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                    {viewingVoucher.partnerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-base font-heading">
                    {viewingVoucher.partnerName}
                  </h4>
                  <div className="text-xs text-emerald-600 font-extrabold">
                    {viewingVoucher.discountValue}
                  </div>
                </div>
              </div>

              {/* Offer description */}
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {viewingVoucher.offerTitle}
              </div>

              {/* Simulated QR Code / Barcode Presentation */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl text-center space-y-3 shadow-inner">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                  {/* SVG QR Code Simulation */}
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" fill="black" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="black" />
                    <rect x="70" y="0" width="30" height="30" fill="black" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="black" />
                    <rect x="0" y="70" width="30" height="30" fill="black" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="black" />
                    <rect x="40" y="10" width="10" height="20" fill="black" />
                    <rect x="40" y="40" width="20" height="20" fill="black" />
                    <rect x="70" y="40" width="10" height="10" fill="black" />
                    <rect x="85" y="55" width="15" height="15" fill="black" />
                    <rect x="40" y="70" width="20" height="10" fill="black" />
                    <rect x="70" y="70" width="20" height="20" fill="black" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Código do Cupom
                  </div>
                  <div className="font-mono text-xl font-black text-amber-300 tracking-wider">
                    {viewingVoucher.couponCode}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Apresente este código ou QR Code no caixa no momento do pagamento
                </p>
              </div>

              {/* Rules and Expiration */}
              <div className="text-xs text-slate-500 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-800 font-bold">
                  <span>Data Limite:</span>
                  <span className="text-emerald-700">
                    {new Date(viewingVoucher.validUntil).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {viewingVoucher.terms && (
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200">
                    {viewingVoucher.terms}
                  </p>
                )}
              </div>

              {/* Avaliação Pós-Resgate no Histórico */}
              <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-700">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 font-heading">
                      Classificar Experiência da Oferta
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Deixe sua nota para {viewingVoucher.partnerName}
                    </p>
                  </div>
                </div>

                {modalReviewSubmitted ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sua avaliação foi registrada com sucesso!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitVoucherRating} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-1 cursor-pointer select-none"
                        onMouseLeave={() => setModalHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = star <= (modalHoverRating || modalRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setModalRating(star)}
                              onMouseEnter={() => setModalHoverRating(star)}
                              className="p-1 text-slate-300 hover:scale-115 transition-transform cursor-pointer focus:outline-hidden"
                            >
                              <Star
                                className={`w-4 h-4 transition-colors ${
                                  active
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        {modalRating} de 5 estrelas
                      </span>
                    </div>

                    <input
                      type="text"
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                      placeholder="Comentário sobre atendimento ou desconto (opcional)..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 font-medium"
                    />

                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={submittingModalRating}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{submittingModalRating ? 'Salvando...' : 'Avaliar'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action buttons in modal */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(viewingVoucher.id, viewingVoucher.couponCode)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Código</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
};
