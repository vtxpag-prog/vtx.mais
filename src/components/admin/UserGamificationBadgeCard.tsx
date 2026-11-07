import React, { useState } from 'react';
import { RedeemedUserCoupon } from '../../services/api';
import { AdminUser } from '../../types';
import { getUserGamificationState, USER_LEVELS, UserLevelId } from '../../utils/userLevels';
import {
  Award,
  Sparkles,
  Trophy,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Star,
  Zap,
  Info,
} from 'lucide-react';

interface UserGamificationBadgeCardProps {
  coupons: RedeemedUserCoupon[];
  totalSavings: number;
  currentUser: AdminUser;
  onExploreOffers?: () => void;
}

export const UserGamificationBadgeCard: React.FC<UserGamificationBadgeCardProps> = ({
  coupons,
  totalSavings,
  currentUser,
  onExploreOffers,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'badges' | 'tiers'>('status');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'resgates' | 'unlocked' | 'locked'>('all');
  const gamification = getUserGamificationState(coupons, totalSavings);
  const { currentLevel, nextLevel, couponsCount, couponsNeededForNext, progressPercentage, badges } = gamification;

  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;

  const filteredBadges = badges.filter((b) => {
    if (badgeFilter === 'resgates') return b.category === 'resgates';
    if (badgeFilter === 'unlocked') return b.isUnlocked;
    if (badgeFilter === 'locked') return !b.isUnlocked;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-5 p-6">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 shadow-2xs border border-amber-200/60">
            {currentLevel.badgeEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Nível do Clube & Emblemas
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${currentLevel.tagClass}`}>
                {currentLevel.badgeTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ganhe novos níveis e selos exclusivos a cada cupom resgatado no VTXMais
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs self-start sm:self-auto font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
              activeTab === 'status'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Seu Progresso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Emblemas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-black">
              {unlockedBadgesCount}/{badges.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
              activeTab === 'tiers'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Níveis do Clube
          </button>
        </div>
      </div>

      {/* TAB 1: STATUS & PROGRESS */}
      {activeTab === 'status' && (
        <div className="space-y-5">
          {/* Main Visual Level Hero */}
          <div
            className={`rounded-2xl p-6 text-white relative overflow-hidden bg-gradient-to-r ${currentLevel.gradient} shadow-lg`}
          >
            {/* Background elements */}
            <div className="absolute right-0 top-0 -mr-8 -mt-8 text-8xl opacity-15 select-none pointer-events-none">
              {currentLevel.badgeEmoji}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md border border-white/25">
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Rank {currentLevel.levelRank} de 4 • {currentLevel.badgeTitle}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black font-heading tracking-tight flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl">{currentLevel.badgeEmoji}</span>
                    <span>{currentLevel.badgeTitle}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                    {currentLevel.description}
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 shrink-0 md:w-56 text-left">
                <div className="text-[10px] text-white/70 uppercase font-extrabold tracking-wider">
                  Cupons Resgatados
                </div>
                <div className="text-2xl font-black font-heading text-white">
                  {couponsCount} {couponsCount === 1 ? 'cupom' : 'cupons'}
                </div>
                <div className="text-xs text-white/80 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{unlockedBadgesCount} emblemas ativos</span>
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="pt-6 mt-6 border-t border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span className="flex items-center gap-1.5">
                  <span>Progresso para</span>
                  <strong className="text-white underline">
                    {nextLevel ? `${nextLevel.badgeEmoji} ${nextLevel.badgeTitle}` : 'Nível Máximo Conquistado!'}
                  </strong>
                </span>
                <span>
                  {nextLevel
                    ? `${couponsCount} / ${nextLevel.minCoupons} cupons (${progressPercentage}%)`
                    : '100% Concluído'}
                </span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-black/30 p-0.5 overflow-hidden border border-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-emerald-400 transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {nextLevel ? (
                <p className="text-[11px] text-white/80">
                  Falta apenas{' '}
                  <strong className="text-yellow-200">
                    {couponsNeededForNext} {couponsNeededForNext === 1 ? 'resgate' : 'resgates'} de cupom
                  </strong>{' '}
                  para você atingir o {nextLevel.badgeTitle}!
                </p>
              ) : (
                <p className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Parabéns! Você alcançou o nível mais alto de prestígio no Clube VTXMais.
                </p>
              )}
            </div>
          </div>

          {/* Current Level Perks */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vantagens do seu Selo {currentLevel.badgeTitle}:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              {currentLevel.perks.map((perk, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BADGES GALLERY */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span>
                Você desbloqueou <strong>{unlockedBadgesCount}</strong> de <strong>{badges.length}</strong> emblemas
              </span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                Resgate novos cupons para colecionar todos!
              </span>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setBadgeFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  badgeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Todos ({badges.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('resgates')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  badgeFilter === 'resgates'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🔥 Por Resgates
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  badgeFilter === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Conquistados ({unlockedBadgesCount})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('locked')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  badgeFilter === 'locked'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Bloqueados ({badges.length - unlockedBadgesCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredBadges.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border transition-all text-center space-y-2.5 flex flex-col items-center justify-between ${
                  b.isUnlocked
                    ? 'bg-gradient-to-b from-amber-50/60 to-white border-amber-300 shadow-2xs hover:shadow-md hover:border-amber-400'
                    : 'bg-slate-50 border-slate-200/80 opacity-60'
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-2xs ${
                      b.isUnlocked ? 'bg-amber-100/90' : 'bg-slate-200 grayscale'
                    }`}
                  >
                    {b.icon}
                  </div>
                  {!b.isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 w-full">
                  <div
                    className={`text-xs font-bold ${
                      b.isUnlocked ? 'text-slate-900 font-heading' : 'text-slate-500'
                    }`}
                  >
                    {b.title}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {b.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.isUnlocked
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${b.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>{b.currentProgress}/{b.maxProgress}</span>
                    <span className="font-bold">{b.progressPercentage}%</span>
                  </div>
                </div>

                <div>
                  {b.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Conquistado
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Bloqueado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIERS & RANKS SUMMARY */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(USER_LEVELS) as UserLevelId[]).map((levelKey) => {
              const tier = USER_LEVELS[levelKey];
              const isCurrent = tier.id === currentLevel.id;
              const isAchieved = couponsCount >= tier.minCoupons;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-4 space-y-3 relative overflow-hidden transition-all ${
                    isCurrent
                      ? 'border-amber-400 shadow-md bg-amber-50/30 ring-2 ring-amber-400/30'
                      : isAchieved
                      ? 'border-emerald-200 bg-white'
                      : 'border-slate-200 bg-slate-50/80 opacity-70'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-2 right-2 text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                      Seu Nível Atual
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{tier.badgeEmoji}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-heading">
                        {tier.badgeTitle}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {tier.minCoupons === 0
                          ? 'Ao entrar no clube'
                          : `${tier.minCoupons}+ cupons resgatados`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-snug">
                    {tier.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Regalias:
                    </div>
                    {tier.perks.slice(0, 2).map((p, i) => (
                      <div key={i} className="text-[11px] text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{p}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1">
                    {isCurrent ? (
                      <div className="w-full text-center py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-2xs">
                        Ativo na sua Conta
                      </div>
                    ) : isAchieved ? (
                      <div className="w-full text-center py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        ✓ Nível Conquistado
                      </div>
                    ) : (
                      <div className="w-full text-center py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs">
                        Bloqueado ({tier.minCoupons - couponsCount} cupons restantes)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
