import React, { useState } from 'react';
import { RedeemedUserCoupon } from '../../services/api';
import { AdminUser } from '../../types';
import {
  getUserGamificationState,
  AchievementBadge,
  AchievementCategory,
  AchievementRarity,
} from '../../utils/userLevels';
import {
  Trophy,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Star,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoucherAchievementsBannerProps {
  coupons: RedeemedUserCoupon[];
  totalSavings: number;
  currentUser: AdminUser;
  onExploreOffers?: () => void;
}

export const VoucherAchievementsBanner: React.FC<VoucherAchievementsBannerProps> = ({
  coupons,
  totalSavings,
  currentUser,
  onExploreOffers,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'resgates' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  const gamification = getUserGamificationState(coupons, totalSavings);
  const {
    currentLevel,
    nextLevel,
    couponsCount,
    badges,
    activeBadge,
    nextBadge,
    unlockedCount,
    totalBadgesCount,
  } = gamification;

  const triggerCelebrate = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
      });
    } catch {}
  };

  const getRarityBadge = (rarity: AchievementRarity) => {
    switch (rarity) {
      case 'lendario':
        return {
          label: 'Lendário',
          class: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
        };
      case 'epico':
        return {
          label: 'Épico',
          class: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
        };
      case 'raro':
        return {
          label: 'Raro',
          class: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        };
      default:
        return {
          label: 'Comum',
          class: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
        };
    }
  };

  // Filtered badges
  const filteredBadges = badges.filter((b) => {
    if (selectedFilter === 'resgates') return b.category === 'resgates';
    if (selectedFilter === 'unlocked') return b.isUnlocked;
    if (selectedFilter === 'locked') return !b.isUnlocked;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-300">
      {/* Top Panoramic Ribbon: Gamification Status & Active Badge */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Column: Active Badge Highlight & Title */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              onClick={triggerCelebrate}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Clique para celebrar suas conquistas!"
            >
              {activeBadge.icon}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Emblema Atual:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {activeBadge.title}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentLevel.tagClass}`}>
                  {currentLevel.badgeTitle}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black font-heading text-white tracking-tight">
                Sistema de Conquistas & Vouchers Resgatados
              </h3>

              <p className="text-xs text-slate-300 max-w-xl">
                Você já resgatou <strong className="text-amber-300">{couponsCount} {couponsCount === 1 ? 'cupom' : 'cupons'}</strong> e desbloqueou <strong className="text-emerald-300">{unlockedCount} de {totalBadgesCount} emblemas</strong> no clube.
              </p>
            </div>
          </div>

          {/* Right Column: Next Milestone Preview & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
            {nextBadge ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 w-full sm:w-72 text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span>Próximo:</span>
                    <span className="text-white">{nextBadge.icon} {nextBadge.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {nextBadge.currentProgress}/{nextBadge.maxProgress}
                  </span>
                </div>

                {/* Progress bar to next achievement */}
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${nextBadge.progressPercentage}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-300 flex items-center justify-between">
                  <span>
                    Faltam <strong className="text-yellow-300">{Math.max(0, nextBadge.maxProgress - nextBadge.currentProgress)}</strong> cupons
                  </span>
                  <span className="text-emerald-300 font-semibold">{nextBadge.progressPercentage}%</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Todas as metas de resgates principais conquistadas!</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{isExpanded ? 'Recolher Galeria' : 'Ver Todos os Emblemas'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {unlockedCount}/{totalBadgesCount}
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Badges Gallery */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 bg-slate-50/50 border-t border-slate-200/80 animate-fadeIn">
          {/* Controls & Category Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Galeria Completa de Conquistas do Associado</span>
              </h4>
              <p className="text-xs text-slate-500">
                Cada cupom resgatado aproxima você de novos selos e privilégios no VTXMais
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos ({badges.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('resgates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedFilter === 'resgates'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🔥 Por Quantidade ({badges.filter((b) => b.category === 'resgates').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('unlocked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedFilter === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Conquistados ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('locked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedFilter === 'locked'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Bloqueados ({totalBadgesCount - unlockedCount})
              </button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredBadges.map((badge) => {
              const rarity = getRarityBadge(badge.rarity);
              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                    badge.isUnlocked
                      ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-md'
                      : 'bg-slate-100/70 border-slate-200/90 hover:bg-slate-100 opacity-75'
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xs border ${
                          badge.isUnlocked
                            ? 'bg-gradient-to-tr from-amber-100 to-orange-50 border-amber-300 text-amber-900 scale-105'
                            : 'bg-slate-200/80 border-slate-300 text-slate-400 grayscale'
                        }`}
                      >
                        {badge.icon}
                      </div>
                      {!badge.isUnlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${rarity.class}`}>
                        {rarity.label}
                      </span>
                      {badge.isUnlocked ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Desbloqueado
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h5
                      className={`text-sm font-bold leading-snug ${
                        badge.isUnlocked ? 'text-slate-900 font-heading' : 'text-slate-600'
                      }`}
                    >
                      {badge.title}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-slate-500">
                        {badge.category === 'economia'
                          ? `R$ ${badge.currentProgress} / R$ ${badge.maxProgress}`
                          : `${badge.currentProgress} / ${badge.maxProgress} cupons`}
                      </span>
                      <span
                        className={`font-bold ${
                          badge.isUnlocked ? 'text-emerald-600' : 'text-slate-600'
                        }`}
                      >
                        {badge.progressPercentage}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.isUnlocked
                            ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${badge.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick CTA to explore more coupons */}
          {onExploreOffers && (
            <div className="pt-2 flex items-center justify-between text-xs bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80">
              <span className="text-amber-900 font-medium">
                💡 Quer desbloquear novos emblemas? Resgate mais ofertas exclusivas disponíveis no catálogo público!
              </span>
              <button
                type="button"
                onClick={onExploreOffers}
                className="px-3.5 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <span>Ver Ofertas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100"
          >
            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-5xl shadow-md border-2 ${
                selectedBadge.isUnlocked
                  ? 'bg-gradient-to-tr from-amber-100 to-orange-100 border-amber-400'
                  : 'bg-slate-100 border-slate-300 grayscale'
              }`}
            >
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                  getRarityBadge(selectedBadge.rarity).class
                }`}
              >
                Emblema {getRarityBadge(selectedBadge.rarity).label}
              </span>
              <h4 className="text-lg font-black text-slate-900 font-heading pt-1">
                {selectedBadge.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            {/* Perk / Benefit */}
            {selectedBadge.rewardPerk && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Benefício / Vantagem:
                </span>
                <p className="text-[11px] text-slate-600">{selectedBadge.rewardPerk}</p>
              </div>
            )}

            {/* Progress Box in Modal */}
            <div className="space-y-1.5 text-left bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Progresso Atual:</span>
                <span>
                  {selectedBadge.category === 'economia'
                    ? `R$ ${selectedBadge.currentProgress} / R$ ${selectedBadge.maxProgress}`
                    : `${selectedBadge.currentProgress} / ${selectedBadge.maxProgress}`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedBadge.isUnlocked
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${selectedBadge.progressPercentage}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-right">
                {selectedBadge.isUnlocked ? '100% Concluído' : `${selectedBadge.progressPercentage}% concluído`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
