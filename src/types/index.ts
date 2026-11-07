export type CategoryName =
  | 'Promoções do Mês'
  | 'Cashback'
  | 'Comer e Beber'
  | 'Compras e Presentes'
  | 'Cultura e Entretenimento'
  | 'Educação'
  | 'Eletrodomésticos e Eletrônicos'
  | 'Mobilidade'
  | 'Moda Calçados e Acessórios'
  | 'Saúde e Beleza'
  | 'Serviços'
  | 'Variedades'
  | 'Viagens e Experiências';

export type FilterType = 'todos' | 'mais_resgatados' | 'mais_recentes' | 'destaques' | 'perto_de_voce' | 'favoritos';

export type UserRole =
  | 'admin'
  | 'gestor'
  | 'visualizador'
  | 'supervisor'
  | 'gerente'
  | 'diretor'
  | 'auditor';

export interface AdminUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  cpf?: string;
  dataNascimento?: string;
  mustCompleteProfile?: boolean;
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  // Campos do Módulo de Pontos Financeiros
  saldo_disponivel_pontos?: number;
  saldo_bloqueado_pontos?: number;
  saldo_processamento_pontos?: number;
  taxa_desconto_pontos?: number;
  saldo_version?: number;
  aceitou_termos_pontos?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: CategoryName;
  address: string;
  cep: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: 'ativo' | 'inativo';
  createdAt: string;
  // Módulo de Pontos
  aceita_pontos?: boolean;
  pontos_por_real?: number;
}

export interface Offer {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogo: string;
  title: string;
  description: string;
  discountValue: string; // e.g., "30% OFF", "R$ 50 OFF", "15% Cashback"
  discountType: 'percentage' | 'fixed' | 'cashback' | 'gift';
  couponCode: string;
  category: CategoryName;
  validUntil: string;
  image: string;
  isFeatured: boolean;
  terms: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  savesCount: number;
  viewsCount: number;
  rating: number;
  ratingCount?: number;
  distanceKm?: number; // Calculated dynamically if user provides CEP
  createdAt: string;
  status: 'ativo' | 'inativo';
}

export interface OfferReview {
  id: string;
  offerId: string;
  offerTitle: string;
  partnerName: string;
  partnerLogo?: string;
  category: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  userCity?: string;
  couponCode?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
  verifiedRedemption: boolean;
  status: 'aprovado' | 'pendente' | 'oculto';
}

export interface ReviewsReport {
  averageClubRating: number;
  totalReviews: number;
  npsScore: number;
  verifiedPercentage: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  topRatedOffers: {
    offerId: string;
    offerTitle: string;
    partnerName: string;
    rating: number;
    reviewsCount: number;
  }[];
  lowestRatedOffers: {
    offerId: string;
    offerTitle: string;
    partnerName: string;
    rating: number;
    reviewsCount: number;
  }[];
  recentReviews: OfferReview[];
}

export type LeadContactStage =
  | 'novo'
  | 'contatado'
  | 'em_negociacao'
  | 'convertido'
  | 'perdido';

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  stageAtNote?: LeadContactStage;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  couponCode: string;
  offerId: string;
  offerTitle: string;
  partnerName: string;
  category: CategoryName;
  userCep: string;
  userCity?: string;
  userState?: string;
  distanceKm?: number;
  crmStatus: 'enviado' | 'sucesso' | 'falha' | 'pendente';
  crmResponse?: string;
  createdAt: string;
  origin: string; // e.g. 'Site Público VTXMais'
  contactStage?: LeadContactStage;
  contactNotes?: LeadNote[];
  lastContactedAt?: string;
}

export interface CRMConfig {
  webhookUrl: string;
  apiKey: string;
  providerName: string;
  enabled: boolean;
  fieldMapping: {
    leadName: string;
    leadEmail: string;
    leadPhone: string;
    couponCode: string;
    couponTitle: string;
    category: string;
    cep: string;
    timestamp: string;
    origin: string;
  };
  lastTestStatus?: 'sucesso' | 'falha' | null;
  lastTestMessage?: string;
  lastTestedAt?: string;
}

export type CRMHealthState = 'healthy' | 'degraded' | 'unreachable' | 'not_configured' | 'testing';

export interface CRMHealthReport {
  state: CRMHealthState;
  statusCode?: number;
  latencyMs: number;
  message: string;
  testedAt: string;
  webhookUrl: string;
  source: 'env' | 'database';
  envVarDefined: boolean;
  isHttps: boolean;
  host?: string;
  authHeaderConfigured: boolean;
  checks: {
    envDefined: boolean;
    validUrlFormat: boolean;
    serverReachable: boolean;
    acceptableLatency: boolean;
  };
  samplePayload?: Record<string, any>;
  responseSnippet?: string;
}

export interface CRMLog {
  id: string;
  leadId: string;
  leadName: string;
  endpoint: string;
  status: number;
  success: boolean;
  requestPayload: any;
  responseBody: string;
  createdAt: string;
}

export interface UserSessionData {
  name: string;
  phone: string;
  email: string;
  cpf?: string;
  userCep?: string;
  savedAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  userCep?: string;
  createdAt: string;
  lastLoginAt: string;
  redeemedOffers: string[];
}

export type AdvertiserKanbanStage =
  | 'novo_cadastro'
  | 'em_negociacao'
  | 'proposta_enviada'
  | 'contrato_fechado'
  | 'perdido_pausado';

export interface AdvertiserLead {
  id: string;
  companyName: string;
  tradeName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  phone: string;
  category: CategoryName;
  city: string;
  state: string;
  discountProposal: string;
  kanbanStage: AdvertiserKanbanStage;
  createdAt: string;
  lastContactAt?: string;
  slaDeadlineHours: number; // default 24h
  notes?: string[];
}

export type CustomerKanbanStage =
  | 'novo_lead'
  | 'primeiro_contato'
  | 'cupom_resgatado'
  | 'usuario_ativo'
  | 'inativo';

export interface TopBanner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText: string;
  ctaLink?: string;
  imageUrl?: string;
  isImageBanner: boolean;
  active: boolean;
  order: number;
  bgGradient?: string;
  textColor?: string;
}

export interface MediaItem {
  id: string;
  offerId: string;
  offerTitle: string;
  partnerId?: string;
  partnerName?: string;
  url: string;
  sizeBytes: number;
  createdAt: string;
  status: 'active' | 'suspended';
}

export type NotificationType =
  | 'sla_advertiser'
  | 'sla_user'
  | 'new_advertiser'
  | 'new_lead'
  | 'system';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetId?: string;
  targetType?: 'advertiser' | 'lead';
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  createdAt: string;
  read: boolean;
  hoursWaiting?: number;
}

export interface CategoryConversionData {
  category: string;
  views: number;
  leads: number;
  convertedLeads: number;
  conversionRate: number; // Percentage: (leads / views) * 100
  crmConversionRate: number; // Percentage: (convertedLeads / leads) * 100
  avgSavingsBrl: number;
}

export interface DailyActivityPoint {
  date: string; // "2026-10-01"
  label: string; // "01/10"
  fullDate: string; // "01/10/2026"
  dayOfWeek: string; // "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"
  dailyRedemptions: number; // Volume de resgates diários
  dailyLeads: number; // Novos leads capturados no dia
  cumulativeRedemptions: number; // Resgates acumulados ao longo do tempo
  cumulativeLeads: number; // Crescimento acumulado de novos leads
  conversionRate: number; // Taxa diária de conversão (%)
  estimatedSavingsBrl: number; // Economia gerada no dia
}

export interface AnalyticsStats {
  totalLeads: number;
  totalViews: number;
  conversionRate: number;
  activePartners: number;
  activeOffers: number;
  totalSavings: number;
  averageSavingsPerLead: number;
  savingsTimeline: {
    month: string;
    monthlySavings: number;
    cumulativeSavings: number;
    leadsCount: number;
  }[];
  savingsByCategory: {
    category: string;
    totalSavings: number;
    averagePerLead: number;
    leadsCount: number;
  }[];
  topOffers: { id: string; title: string; partner: string; saves: number; conversion: number }[];
  leadsByCategory: { category: string; count: number; percentage: number }[];
  leadsByRegion: { state: string; count: number }[];
  recentLeads: Lead[];
  categoryConversion?: CategoryConversionData[];
  dailyTimeline?: DailyActivityPoint[];
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado

export type PushTargetAudience =
  | 'todos_cadastrados'
  | 'usuarios_sp'
  | 'usuarios_rj'
  | 'usuarios_mg'
  | 'categoria_gastronomia'
  | 'categoria_eletronicos'
  | 'categoria_saude'
  | 'inativos_7_dias';

export interface WeeklyPushSchedule {
  id: string;
  title: string;
  body: string;
  targetAudience: PushTargetAudience;
  daysOfWeek: DayOfWeek[];
  timeOfDay: string; // "18:00"
  active: boolean;
  offerId?: string;
  offerTitle?: string;
  category?: CategoryName;
  createdAt: string;
  createdBy: string;
  lastSentAt?: string;
  nextScheduledAt: string;
  totalSentCount: number;
  estimatedAudienceSize: number;
}

export interface PushSendHistoryLog {
  id: string;
  scheduleId?: string;
  scheduleTitle?: string;
  title: string;
  body: string;
  targetAudience: PushTargetAudience;
  sentAt: string;
  recipientCount: number;
  openedCount: number;
  clickRate: number;
  status: 'entregue' | 'falha' | 'em_processamento';
  offerId?: string;
}

// =========================================================================
// MÓDULO CENTRAL DE PONTOS FINANCEIROS (PONTOS VTXMAIS)
// =========================================================================

export type PointsTransactionType = 'C' | 'D'; // C = Crédito, D = Débito

export type PointsOperationType =
  | 'compra_pix'           // Aquisição via PIX
  | 'resgate_pix'          // Saque financeiro PIX
  | 'compra_parceiro'      // Utilização nos parceiros afiliados
  | 'estorno_compra'       // Estorno de compra em parceiro
  | 'cartao_pre_pago'      // Conversão para cartão pré-pago
  | 'recarga_cartao'       // Recarga de cartão
  | 'ajuste_auditoria'     // Ajuste autorizado pela auditoria
  | 'reversao_resgate';    // Reversão de saque expirado/rejeitado

export type PointsRequestStatus =
  | 'pendente_pagamento'   // Compra PIX aguardando pagamento
  | 'solicitado'           // Resgate/Cartão aguardando aprovação
  | 'em_analise_supervisor'
  | 'em_analise_gerente'
  | 'em_analise_diretor'
  | 'aprovado'
  | 'rejeitado'
  | 'concluido'
  | 'expirado'
  | 'cancelado';

export interface PointsLedgerEntry {
  id: string;
  usuario_id: string;
  usuario_nome?: string;
  tipo: PointsTransactionType;
  valor: number;
  data: string;
  origem: string;
  destino: string;
  saldo_anterior: number;
  saldo_posterior: number;
  versao: number;
  idempotency_key: string;
  transaction_id: string;
  correlation_id?: string;
  aprovado_por?: string;
  descricao: string;
  operacao: PointsOperationType;
  metadata?: Record<string, any>;
}

export interface PointsPrepaidCard {
  id: string;
  usuario_id: string;
  tipo: 'virtual' | 'fisico';
  numero_mascarado: string;
  titular_nome: string;
  validade: string;
  cvv_dinamico?: string;
  bandeira: 'Mastercard' | 'Elo';
  status: 'ativo' | 'bloqueado' | 'em_fabricacao' | 'em_transito';
  saldo_cartao: number;
  criado_em: string;
  endereco_entrega?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
}

export type ApprovalTier = 'automatica' | 'supervisor' | 'supervisor_gerente' | 'supervisor_gerente_diretor';

export interface PointsRequest {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_cpf?: string;
  operacao: PointsOperationType;
  valor_pontos: number;
  valor_reais: number;
  taxa_aplicada: number;
  status: PointsRequestStatus;
  alcada_necessaria: ApprovalTier;
  aprovacoes_necessarias: ('supervisor' | 'gerente' | 'diretor')[];
  aprovacoes_obtidas: {
    nivel: 'supervisor' | 'gerente' | 'diretor';
    aprovador_id: string;
    aprovador_nome: string;
    decisao: 'aprovado' | 'rejeitado';
    data: string;
    motivo?: string;
  }[];
  chave_pix_destino?: {
    tipo: 'cpf' | 'email' | 'telefone' | 'aleatoria';
    chave: string;
    banco?: string;
  };
  dados_pix_compra?: {
    qr_code_svg?: string;
    copia_e_cola: string;
    txid: string;
    expira_em: string;
  };
  parceiro_id?: string;
  parceiro_nome?: string;
  oferta_id?: string;
  oferta_titulo?: string;
  cartao_id?: string;
  idempotency_key: string;
  transaction_id: string;
  criado_em: string;
  atualizado_em: string;
  expira_em?: string;
}

export interface UserPointsWallet {
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_cpf?: string;
  saldo_disponivel_pontos: number;
  saldo_bloqueado_pontos: number;
  saldo_processamento_pontos: number;
  taxa_desconto_pontos: number;
  saldo_version: number;
  aceitou_termos_pontos?: boolean;
  termos_aceitos_em?: string;
  cartoes?: PointsPrepaidCard[];
  extrato_recente?: PointsLedgerEntry[];
}

export interface MotherAccountState {
  cnpj: string;
  razao_social: string;
  banco: string;
  agencia: string;
  conta_corrente: string;
  saldo_total_reais: number;
  total_saldos_disponiveis: number;
  total_saldos_bloqueados: number;
  total_saldos_processamento: number;
  total_cartoes_emitidos: number;
  diferenca_conciliacao: number;
  status_conciliacao: 'conciliado' | 'divergencia';
  ultima_conciliacao: string;
  bloqueio_operacoes: boolean;
  total_usuarios_ativos: number;
  total_transacoes_historico: number;
}

export interface PointsRateHistory {
  id: string;
  usuario_id?: string;
  taxa_anterior: number;
  taxa_nova: number;
  alterado_por: string;
  alterado_por_nome: string;
  motivo: string;
  data: string;
}

export interface PointsAuditEntry {
  id: string;
  data: string;
  acao: string;
  usuario_id: string;
  executor_id: string;
  executor_nome: string;
  detalhes: string;
  ip?: string;
  nivel_severidade: 'info' | 'alerta' | 'critico';
}

export interface PointsRiskAlert {
  id: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  titulo: string;
  descricao: string;
  data: string;
  status: 'ativo' | 'em_investigacao' | 'resolvido';
  usuario_id?: string;
  usuario_nome?: string;
  transaction_id?: string;
  detalhes: Record<string, any>;
  resolvido_por?: string;
  resolvido_em?: string;
}

export interface TimeTravelSnapshot {
  data_solicitada: string;
  usuario_id?: string;
  usuario_nome?: string;
  saldo_disponivel_calculado: number;
  saldo_bloqueado_calculado: number;
  saldo_conta_mae_calculado: number;
  total_lancamentos_ate_data: number;
  lancamentos_no_periodo: PointsLedgerEntry[];
  status_integridade: 'integro' | 'inconsistente';
}

export interface ReplaySimulationResult {
  cenario_id: string;
  nome_cenario: string;
  total_eventos_processados: number;
  eventos_sucesso: number;
  eventos_falha: number;
  saldo_inicial_simulado: number;
  saldo_final_esperado: number;
  saldo_final_obtido: number;
  status: 'aprovado' | 'divergencia_detectada';
  tempo_execucao_ms: number;
  divergencias: string[];
  executado_em: string;
}

// =========================================================================
// FASE 12: PORTAL DO LOJISTA, VALIDAÇÃO POS & CLEARING HOUSE DE REPASSES
// =========================================================================

export type CouponValidationStatus = 'confirmado' | 'estornado' | 'duplicado' | 'expirado';
export type PayoutSettlementStatus = 'pendente' | 'em_lote' | 'liquidado_pix' | 'cancelado';

export interface CouponValidation {
  id: string;
  couponCode: string;
  offerId: string;
  offerTitle: string;
  partnerId: string;
  partnerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billAmount: number;             // Valor bruto da conta/consumo (R$)
  discountApplied: number;        // Desconto concedido (R$)
  netAmountPaid: number;          // Valor pago pelo cliente na loja (R$)
  pointsUsed: number;             // Pontos abatidos na compra (se houver)
  validatedAt: string;
  validatedBy: string;            // Nome do atendente / caixa
  status: CouponValidationStatus;
  payoutStatus: PayoutSettlementStatus;
  settlementId?: string;
  notes?: string;
}

export type SettlementStatus = 'aberto' | 'fechado' | 'aprovado' | 'liquidado_pix' | 'cancelado';

export interface PartnerSettlement {
  id: string;                     // Ex: SET-OUTBACK-202610-01
  partnerId: string;
  partnerName: string;
  partnerCnpj: string;
  partnerPixKey: string;
  periodStart: string;
  periodEnd: string;
  totalValidations: number;
  grossVolumeBrl: number;         // Total consumido em compras
  discountVolumeBrl: number;      // Total de descontos ofertados
  clubCommissionRate: number;     // Ex: 0.10 (10% de comissão retida pelo Clube)
  clubCommissionBrl: number;      // Comissão retida pelo Clube VTXMais
  pointsReimbursementBrl: number; // Reembolso por pontos aceitos (R$)
  netPayoutBrl: number;           // Valor líquido pago ao parceiro
  status: SettlementStatus;
  settledAt?: string;
  settledBy?: string;
  pixTransactionId?: string;
  validationIds: string[];
  notes?: string;
  receiptUrl?: string;
}

export interface PartnerPOSStats {
  partnerId: string;
  partnerName: string;
  validationsToday: number;
  grossVolumeToday: number;
  discountGivenToday: number;
  totalValidationsMonth: number;
  pendingSettlementAmount: number;
  lastValidationAt?: string;
}

