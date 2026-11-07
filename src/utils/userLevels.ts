import { RedeemedUserCoupon } from '../services/api';

export type UserLevelId = 'bronze' | 'prata' | 'ouro' | 'diamante';

export interface UserLevelInfo {
  id: UserLevelId;
  name: string;
  badgeEmoji: string;
  badgeTitle: string;
  levelRank: number; // 1 to 4
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  borderGlow: string;
  gradient: string;
  tagClass: string;
  minCoupons: number;
  nextLevelCoupons: number | null;
  perks: string[];
  description: string;
}

export const USER_LEVELS: Record<UserLevelId, UserLevelInfo> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    badgeEmoji: '🥉',
    badgeTitle: 'Membro Bronze',
    levelRank: 1,
    color: 'amber-700',
    textColor: 'text-amber-300',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-700/60',
    borderGlow: 'shadow-amber-900/30',
    gradient: 'from-amber-700 via-amber-800 to-amber-950',
    tagClass: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    minCoupons: 0,
    nextLevelCoupons: 2,
    perks: ['Acesso a todos os cupons básicos', 'Resgate ilimitado', 'Geolocalização por CEP'],
    description: 'Nível inicial do clube. Resgate 2 cupons para avançar para Prata!',
  },
  prata: {
    id: 'prata',
    name: 'Prata',
    badgeEmoji: '🥈',
    badgeTitle: 'Membro Prata',
    levelRank: 2,
    color: 'slate-300',
    textColor: 'text-slate-200',
    bgColor: 'bg-slate-800/60',
    borderColor: 'border-slate-400/60',
    borderGlow: 'shadow-slate-400/20',
    gradient: 'from-slate-400 via-slate-500 to-slate-700',
    tagClass: 'bg-slate-700/60 text-slate-200 border-slate-400/50',
    minCoupons: 2,
    nextLevelCoupons: 5,
    perks: [
      'Selo Prata exclusivo no perfil',
      'Desbloqueio de emblemas especiais',
      'Extrato detalhado de economia',
      'Alertas de novos cupons',
    ],
    description: 'Caçador assíduo de vantagens. Faltam poucos cupons para o Nível Ouro!',
  },
  ouro: {
    id: 'ouro',
    name: 'Ouro',
    badgeEmoji: '🥇',
    badgeTitle: 'Membro Ouro',
    levelRank: 3,
    color: 'yellow-400',
    textColor: 'text-amber-300',
    bgColor: 'bg-amber-950/50',
    borderColor: 'border-yellow-500/70',
    borderGlow: 'shadow-yellow-500/30',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    tagClass: 'bg-amber-500/20 text-yellow-300 border-yellow-500/50',
    minCoupons: 5,
    nextLevelCoupons: 9,
    perks: [
      'Selo Dourado VIP no perfil',
      'Acesso prioritário a cupons relâmpago',
      'Emblema Mestre da Economia',
      'Atendimento preferencial no clube',
    ],
    description: 'Nível VIP de prestígio. Economizador experiente com descontos de alta economia.',
  },
  diamante: {
    id: 'diamante',
    name: 'Diamante',
    badgeEmoji: '💎',
    badgeTitle: 'Membro Diamante VIP',
    levelRank: 4,
    color: 'cyan-400',
    textColor: 'text-cyan-300',
    bgColor: 'bg-cyan-950/50',
    borderColor: 'border-cyan-400/70',
    borderGlow: 'shadow-cyan-400/30',
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    tagClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    minCoupons: 9,
    nextLevelCoupons: null, // Max level reached!
    perks: [
      'Status Máximo: Embaixador Diamante',
      'Selo Holográfico Diamante no perfil',
      'Acesso a todas as regalias e premiações',
      'Emblemas lendários desbloqueados',
    ],
    description: 'Nível Máximo conquistado! Você é um embaixador oficial da economia no VTXMais.',
  },
};

export type AchievementCategory = 'resgates' | 'economia' | 'categorias' | 'engajamento';
export type AchievementRarity = 'comum' | 'raro' | 'epico' | 'lendario';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  thresholdCoupons?: number;
  currentProgress: number;
  maxProgress: number;
  progressPercentage: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rewardPerk?: string;
}

export interface UserGamificationState {
  currentLevel: UserLevelInfo;
  nextLevel: UserLevelInfo | null;
  couponsCount: number;
  couponsNeededForNext: number;
  progressPercentage: number;
  badges: AchievementBadge[];
  activeBadge: AchievementBadge;
  nextBadge: AchievementBadge | null;
  unlockedCount: number;
  totalBadgesCount: number;
}

export function getUserGamificationState(
  coupons: RedeemedUserCoupon[],
  totalSavings: number = 0
): UserGamificationState {
  const count = coupons.length;

  let currentLevelId: UserLevelId = 'bronze';
  if (count >= 9) {
    currentLevelId = 'diamante';
  } else if (count >= 5) {
    currentLevelId = 'ouro';
  } else if (count >= 2) {
    currentLevelId = 'prata';
  }

  const currentLevel = USER_LEVELS[currentLevelId];
  let nextLevel: UserLevelInfo | null = null;
  let couponsNeededForNext = 0;
  let progressPercentage = 100;

  if (currentLevelId === 'bronze') {
    nextLevel = USER_LEVELS.prata;
    const target = 2;
    couponsNeededForNext = Math.max(0, target - count);
    progressPercentage = Math.min(100, Math.round((count / target) * 100));
  } else if (currentLevelId === 'prata') {
    nextLevel = USER_LEVELS.ouro;
    const base = 2;
    const target = 5;
    couponsNeededForNext = Math.max(0, target - count);
    progressPercentage = Math.min(100, Math.round(((count - base) / (target - base)) * 100));
  } else if (currentLevelId === 'ouro') {
    nextLevel = USER_LEVELS.diamante;
    const base = 5;
    const target = 9;
    couponsNeededForNext = Math.max(0, target - count);
    progressPercentage = Math.min(100, Math.round(((count - base) / (target - base)) * 100));
  } else {
    // Diamante: max level
    progressPercentage = 100;
    couponsNeededForNext = 0;
  }

  // Categories & engagement checks
  const hasFood = coupons.some((c) =>
    c.category?.toLowerCase().includes('comer') || c.category?.toLowerCase().includes('gastronomia')
  );
  const hasTech = coupons.some((c) =>
    c.category?.toLowerCase().includes('eletro') || c.category?.toLowerCase().includes('tecnologia')
  );
  const hasHealth = coupons.some((c) =>
    c.category?.toLowerCase().includes('saúde') || c.category?.toLowerCase().includes('beleza')
  );
  const hasUsedCoupon = coupons.some((c) => c.status === 'utilizado');

  const uniqueCategories = new Set(coupons.map((c) => c.category)).size;

  // Progressive Achievements System
  const badges: AchievementBadge[] = [
    // --- MARCOS POR QUANTIDADE DE CUPONS RESGATADOS ---
    {
      id: 'badge_first_redeem',
      title: 'Pioneiro da Economia',
      description: 'Resgatou seu 1º cupom de desconto no Clube VTXMais',
      icon: '🚀',
      category: 'resgates',
      rarity: 'comum',
      thresholdCoupons: 1,
      currentProgress: Math.min(count, 1),
      maxProgress: 1,
      progressPercentage: Math.min(100, Math.round((count / 1) * 100)),
      isUnlocked: count >= 1,
      rewardPerk: 'Acesso liberado a todas as categorias do clube',
    },
    {
      id: 'badge_active_saver',
      title: 'Economizador Ativo',
      description: 'Resgatou 2 cupons de vantagens no clube',
      icon: '⚡',
      category: 'resgates',
      rarity: 'comum',
      thresholdCoupons: 2,
      currentProgress: Math.min(count, 2),
      maxProgress: 2,
      progressPercentage: Math.min(100, Math.round((count / 2) * 100)),
      isUnlocked: count >= 2,
      rewardPerk: 'Promoção para Nível Prata',
    },
    {
      id: 'badge_offer_hunter',
      title: 'Caçador de Ofertas',
      description: 'Resgatou 3 cupons de economia em estabelecimentos parceiros',
      icon: '🎯',
      category: 'resgates',
      rarity: 'raro',
      thresholdCoupons: 3,
      currentProgress: Math.min(count, 3),
      maxProgress: 3,
      progressPercentage: Math.min(100, Math.round((count / 3) * 100)),
      isUnlocked: count >= 3,
      rewardPerk: 'Destaque visual no Histórico de Vouchers',
    },
    {
      id: 'badge_avid_redeemer',
      title: 'Resgatador Ávido',
      description: 'Alcançou a marca de 5 cupons resgatados com sucesso no clube',
      icon: '🔥',
      category: 'resgates',
      rarity: 'raro',
      thresholdCoupons: 5,
      currentProgress: Math.min(count, 5),
      maxProgress: 5,
      progressPercentage: Math.min(100, Math.round((count / 5) * 100)),
      isUnlocked: count >= 5,
      rewardPerk: 'Promoção para Membro Ouro VIP com selo flamejante',
    },
    {
      id: 'badge_benefit_master',
      title: 'Mestre dos Benefícios',
      description: 'Acumulou 8 cupons resgatados com alto poder de economia',
      icon: '🏅',
      category: 'resgates',
      rarity: 'epico',
      thresholdCoupons: 8,
      currentProgress: Math.min(count, 8),
      maxProgress: 8,
      progressPercentage: Math.min(100, Math.round((count / 8) * 100)),
      isUnlocked: count >= 8,
      rewardPerk: 'Emblema Épico de Mestre e prioridade em ofertas relâmpago',
    },
    {
      id: 'badge_diamond_rank',
      title: 'Embaixador Diamante',
      description: 'Resgatou 9 ou mais cupons e atingiu o Nível Máximo Diamante',
      icon: '💎',
      category: 'resgates',
      rarity: 'epico',
      thresholdCoupons: 9,
      currentProgress: Math.min(count, 9),
      maxProgress: 9,
      progressPercentage: Math.min(100, Math.round((count / 9) * 100)),
      isUnlocked: count >= 9,
      rewardPerk: 'Status Diamante Vitalício e atendimento exclusivo',
    },
    {
      id: 'badge_coupon_collector',
      title: 'Colecionador de Cupons',
      description: 'Superou 12 cupons resgatados na sua carteira digital',
      icon: '🎟️',
      category: 'resgates',
      rarity: 'epico',
      thresholdCoupons: 12,
      currentProgress: Math.min(count, 12),
      maxProgress: 12,
      progressPercentage: Math.min(100, Math.round((count / 12) * 100)),
      isUnlocked: count >= 12,
      rewardPerk: 'Borda Holográfica Dourada no painel pessoal',
    },
    {
      id: 'badge_legendary_redeemer',
      title: 'Resgatador Lendário',
      description: 'Atingiu a extraordinária marca de 20 cupons resgatados',
      icon: '👑',
      category: 'resgates',
      rarity: 'lendario',
      thresholdCoupons: 20,
      currentProgress: Math.min(count, 20),
      maxProgress: 20,
      progressPercentage: Math.min(100, Math.round((count / 20) * 100)),
      isUnlocked: count >= 20,
      rewardPerk: 'Coroa de Prestígio Máximo e menção de honra no clube',
    },
    {
      id: 'badge_vtx_tycoon',
      title: 'Magnata do VTXMais',
      description: 'Completou mais de 30 resgates: o ápice da economia inteligente',
      icon: '🏆',
      category: 'resgates',
      rarity: 'lendario',
      thresholdCoupons: 30,
      currentProgress: Math.min(count, 30),
      maxProgress: 30,
      progressPercentage: Math.min(100, Math.round((count / 30) * 100)),
      isUnlocked: count >= 30,
      rewardPerk: 'Título de Magnata e selo comemorativo especial',
    },

    // --- CONQUISTAS POR VALOR ECONOMIZADO ---
    {
      id: 'badge_savings_100',
      title: 'Primeiros R$ 100 Salvos',
      description: 'Alcançou mais de R$ 100,00 poupados em descontos reais',
      icon: '💰',
      category: 'economia',
      rarity: 'comum',
      currentProgress: Math.min(Math.round(totalSavings), 100),
      maxProgress: 100,
      progressPercentage: Math.min(100, Math.round((totalSavings / 100) * 100)),
      isUnlocked: totalSavings >= 100,
      rewardPerk: 'Visualização de gráficos mensais de economia',
    },
    {
      id: 'badge_savings_250',
      title: 'Cofre Prata R$ 250+',
      description: 'Superou R$ 250,00 acumulados em economia na conta',
      icon: '💵',
      category: 'economia',
      rarity: 'raro',
      currentProgress: Math.min(Math.round(totalSavings), 250),
      maxProgress: 250,
      progressPercentage: Math.min(100, Math.round((totalSavings / 250) * 100)),
      isUnlocked: totalSavings >= 250,
      rewardPerk: 'Emblema Raro no Extrato Pessoal',
    },
    {
      id: 'badge_savings_500',
      title: 'Super Poupador R$ 500+',
      description: 'Economizou mais de R$ 500,00 com as parcerias VTXMais',
      icon: '🏦',
      category: 'economia',
      rarity: 'epico',
      currentProgress: Math.min(Math.round(totalSavings), 500),
      maxProgress: 500,
      progressPercentage: Math.min(100, Math.round((totalSavings / 500) * 100)),
      isUnlocked: totalSavings >= 500,
      rewardPerk: 'Emblema Épico de Super Poupador',
    },
    {
      id: 'badge_savings_1000',
      title: 'Milionário em Cupons R$ 1.000+',
      description: 'Quebrou a barreira dos R$ 1.000,00 economizados no clube',
      icon: '✨',
      category: 'economia',
      rarity: 'lendario',
      currentProgress: Math.min(Math.round(totalSavings), 1000),
      maxProgress: 1000,
      progressPercentage: Math.min(100, Math.round((totalSavings / 1000) * 100)),
      isUnlocked: totalSavings >= 1000,
      rewardPerk: 'Emblema Dourado com brilho reluzente',
    },

    // --- CONQUISTAS POR CATEGORIAS & ENGAJAMENTO ---
    {
      id: 'badge_foodie',
      title: 'Gourmet Econômico',
      description: 'Resgatou oferta de restaurante, café ou gastronomia',
      icon: '🍔',
      category: 'categorias',
      rarity: 'comum',
      currentProgress: hasFood ? 1 : 0,
      maxProgress: 1,
      progressPercentage: hasFood ? 100 : 0,
      isUnlocked: hasFood,
      rewardPerk: 'Emblema culinário exclusivo',
    },
    {
      id: 'badge_tech',
      title: 'Tech Hunter',
      description: 'Aproveitou desconto em eletrônicos, informática ou eletro',
      icon: '📱',
      category: 'categorias',
      rarity: 'comum',
      currentProgress: hasTech ? 1 : 0,
      maxProgress: 1,
      progressPercentage: hasTech ? 100 : 0,
      isUnlocked: hasTech,
      rewardPerk: 'Emblema de tecnologia',
    },
    {
      id: 'badge_health',
      title: 'Bem-Estar & Saúde',
      description: 'Resgatou cupom em farmácia, drogaria ou clínica estética',
      icon: '💊',
      category: 'categorias',
      rarity: 'comum',
      currentProgress: hasHealth ? 1 : 0,
      maxProgress: 1,
      progressPercentage: hasHealth ? 100 : 0,
      isUnlocked: hasHealth,
      rewardPerk: 'Emblema de saúde e bem-estar',
    },
    {
      id: 'badge_explorer',
      title: 'Explorador Versátil',
      description: 'Resgatou cupons em 3 ou mais categorias diferentes',
      icon: '🧭',
      category: 'categorias',
      rarity: 'raro',
      currentProgress: Math.min(uniqueCategories, 3),
      maxProgress: 3,
      progressPercentage: Math.min(100, Math.round((uniqueCategories / 3) * 100)),
      isUnlocked: uniqueCategories >= 3,
      rewardPerk: 'Insígnia de versatilidade e exploração',
    },
    {
      id: 'badge_first_used',
      title: 'Voucher Validado no Caixa',
      description: 'Marcou pelo menos um cupom como utilizado no parceiro',
      icon: '🏷️',
      category: 'engajamento',
      rarity: 'raro',
      currentProgress: hasUsedCoupon ? 1 : 0,
      maxProgress: 1,
      progressPercentage: hasUsedCoupon ? 100 : 0,
      isUnlocked: hasUsedCoupon,
      rewardPerk: 'Certificado de economia efetiva comprovada',
    },
  ];

  // Determine current active highest achievement badge for coupon redemption
  const unlockedCouponBadges = badges
    .filter((b) => b.category === 'resgates' && b.isUnlocked)
    .sort((a, b) => (b.thresholdCoupons || 0) - (a.thresholdCoupons || 0));

  const activeBadge: AchievementBadge = unlockedCouponBadges[0] || {
    id: 'badge_starter',
    title: 'Novo Associado',
    description: 'Resgate seu primeiro cupom para desbloquear seus primeiros emblemas',
    icon: '🌱',
    category: 'resgates',
    rarity: 'comum',
    thresholdCoupons: 0,
    currentProgress: count,
    maxProgress: 1,
    progressPercentage: Math.min(100, Math.round((count / 1) * 100)),
    isUnlocked: true,
    rewardPerk: 'Início da jornada de vantagens no VTXMais',
  };

  // Determine next milestone badge based on coupon count
  const lockedCouponBadges = badges
    .filter((b) => b.category === 'resgates' && !b.isUnlocked)
    .sort((a, b) => (a.thresholdCoupons || 0) - (b.thresholdCoupons || 0));

  const nextBadge: AchievementBadge | null = lockedCouponBadges[0] || null;
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return {
    currentLevel,
    nextLevel,
    couponsCount: count,
    couponsNeededForNext,
    progressPercentage,
    badges,
    activeBadge,
    nextBadge,
    unlockedCount,
    totalBadgesCount: badges.length,
  };
}
