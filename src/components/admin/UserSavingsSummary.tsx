import React, { useState, useEffect } from 'react';
import { AdminUser, Offer } from '../../types';
import { userCouponsService, RedeemedUserCoupon, api } from '../../services/api';
import {
  Wallet,
  PiggyBank,
  Sparkles,
  Tag,
  Copy,
  Check,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Gift,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Search,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserGamificationBadgeCard } from './UserGamificationBadgeCard';
import { UserSavingsBarChart } from './UserSavingsBarChart';

interface UserSavingsSummaryProps {
  currentUser: AdminUser;
  onExploreOffers?: () => void;
}

export const UserSavingsSummary: React.FC<UserSavingsSummaryProps> = ({
  currentUser,
  onExploreOffers,
}) => {
  const userKey = currentUser.username || currentUser.email || currentUser.id || 'admin';
  const [coupons, setCoupons] = useState<RedeemedUserCoupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'savings'>('savings');

  // Quick redeem drawer / modal state
  const [showQuickRedeem, setShowQuickRedeem] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Load user redeemed coupons
  const loadCoupons = () => {
    const list = userCouponsService.getRedeemedCoupons(userKey);
    setCoupons(list);
  };

  useEffect(() => {
    loadCoupons();
  }, [userKey]);

  // Load available offers for quick test/redeem
  useEffect(() => {
    if (showQuickRedeem && availableOffers.length === 0) {
      setLoadingOffers(true);
      api.getOffers()
        .then((res) => {
          setAvailableOffers(res.offers);
        })
        .catch(console.error)
        .finally(() => setLoadingOffers(false));
    }
  }, [showQuickRedeem]);

  // Calculations
  const totalSaved = userCouponsService.calculateTotalSavings(coupons);
  const totalCount = coupons.length;
  const avgSaved = totalCount > 0 ? totalSaved / totalCount : 0;
  const maxSavingsCoupon = coupons.reduce(
    (max, c) => (c.calculatedSavings > (max?.calculatedSavings || 0) ? c : max),
    coupons[0]
  );

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Quick claim an offer directly into user savings portfolio
  const handleQuickClaim = (offer: Offer) => {
    userCouponsService.addRedeemedCoupon(userKey, {
      offerId: offer.id,
      offerTitle: offer.title,
      partnerName: offer.partnerName,
      partnerLogo: offer.partnerLogo,
      category: offer.category,
      couponCode: offer.couponCode,
      discountValue: offer.discountValue,
    });

    loadCoupons();
    setShowQuickRedeem(false);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch {}
  };

  // Filtered and sorted coupons
  const filteredCoupons = coupons
    .filter((c) => {
      const q = filterQuery.toLowerCase();
      return (
        c.offerTitle.toLowerCase().includes(q) ||
        c.partnerName.toLowerCase().includes(q) ||
        c.couponCode.toLowerCase().includes(q) ||
        c.discountValue.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'savings') return b.calculatedSavings - a.calculatedSavings;
      return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime();
    });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-6 p-6">
      {/* Top Banner: Prominent Total Display */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Extrato Pessoal de Economia • {currentUser.name || currentUser.username}</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
                Total Economizado por Você em Cupons
              </div>
              {/* Prominent Total Big Number */}
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading text-white tracking-tight flex items-baseline gap-2">
                <span>{formatBRL(totalSaved)}</span>
                <span className="text-sm sm:text-base font-semibold text-emerald-300">
                  acumulados
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Cálculo em tempo real gerado pela soma dos descontos nominais e percentuais das{' '}
              <strong className="text-emerald-300">{totalCount} ofertas</strong> resgatadas na sua conta.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickRedeem(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Resgatar Mais Cupons</span>
            </button>

            {onExploreOffers && (
              <button
                type="button"
                onClick={onExploreOffers}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
                <span>Ver Vitrine do Clube</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial Highlight Cards inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-0.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Cupons Resgatados
            </div>
            <div className="text-xl font-black text-white font-heading">
              {totalCount} <span className="text-xs font-normal text-slate-400">ofertas</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-0.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Média por Cupom
            </div>
            <div className="text-xl font-black text-emerald-300 font-heading">
              {formatBRL(avgSaved)}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-0.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Maior Desconto
            </div>
            <div className="text-xl font-black text-amber-300 font-heading truncate">
              {maxSavingsCoupon ? formatBRL(maxSavingsCoupon.calculatedSavings) : 'R$ 0,00'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {maxSavingsCoupon?.partnerName || 'Nenhum'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-0.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Status da Carteira
            </div>
            <div className="text-base font-black text-white flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Válidos</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Prontos para uso</div>
          </div>
        </div>
      </div>

      {/* Gamification Badges & Levels Component */}
      <UserGamificationBadgeCard
        coupons={coupons}
        totalSavings={totalSaved}
        currentUser={currentUser}
        onExploreOffers={onExploreOffers}
      />

      {/* 6-Month Savings Bar Chart with Recharts */}
      <UserSavingsBarChart coupons={coupons} />

      {/* Redeemed Coupons List & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Cupons na sua Carteira Pessoal</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cada cupom resgatado abaixo contribui diretamente para a sua economia acumulada.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar cupons..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-36 sm:w-48"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSortBy('savings')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  sortBy === 'savings'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Economia
              </button>
              <button
                type="button"
                onClick={() => setSortBy('date')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  sortBy === 'date'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Recentes
              </button>
            </div>
          </div>
        </div>

        {/* Coupons List */}
        {filteredCoupons.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <PiggyBank className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Nenhum cupom encontrado</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Resgate novas ofertas do clube para abastecer sua carteira de descontos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all p-4 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {coupon.partnerLogo ? (
                      <img
                        src={coupon.partnerLogo}
                        alt={coupon.partnerName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {coupon.partnerName}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {coupon.category}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Savings Highlight Tag */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      +{formatBRL(coupon.calculatedSavings)}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {coupon.discountValue}
                    </div>
                  </div>
                </div>

                {/* Offer Title & Validity Status */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                    {coupon.offerTitle}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    {(() => {
                      const valInfo = userCouponsService.getValidityInfo(coupon);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${valInfo.badgeClass}`}>
                          {valInfo.label}
                        </span>
                      );
                    })()}
                    <span className="text-slate-400 text-[10px]">
                      Até {new Date(coupon.validUntil || '2026-10-30').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span>{coupon.couponCode}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.id, coupon.couponCode)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      copiedId === coupon.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {copiedId === coupon.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Redeem Modal / Drawer */}
      {showQuickRedeem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Resgatar Oferta para Adicionar à Sua Economia
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione uma oferta disponível para resgatar o cupom e somar o desconto ao seu total
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRedeem(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingOffers ? (
              <div className="py-12 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 pr-1 max-h-[55vh]">
                {availableOffers.map((offer) => {
                  const estSavings = userCouponsService.calculateSavings(offer.discountValue, offer.category);
                  const isAlreadyClaimed = coupons.some((c) => c.offerId === offer.id);

                  return (
                    <div
                      key={offer.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition flex items-center justify-between gap-3 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.partnerLogo}
                          alt={offer.partnerName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{offer.partnerName}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                              +{formatBRL(estSavings)}
                            </span>
                          </div>
                          <h4 className="text-xs text-slate-700 font-medium line-clamp-1">
                            {offer.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickClaim(offer)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                          isAlreadyClaimed
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAlreadyClaimed ? 'Resgatar Novamente' : 'Resgatar'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
