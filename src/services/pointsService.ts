import {
  UserPointsWallet,
  PointsRequest,
  MotherAccountState,
  PointsLedgerEntry,
  PointsRateHistory,
  PointsRiskAlert,
  PointsAuditEntry,
  TimeTravelSnapshot,
  ReplaySimulationResult,
  PointsPrepaidCard,
  AdminUser,
} from '../types';

export const pointsService = {
  // Obter carteira do usuário atual
  async getWallet(user?: { id?: string; name?: string; email?: string; cpf?: string }): Promise<UserPointsWallet> {
    const params = new URLSearchParams();
    if (user?.id) params.append('userId', user.id);
    if (user?.name) params.append('name', user.name);
    if (user?.email) params.append('email', user.email);
    if (user?.cpf) params.append('cpf', user.cpf);

    const res = await fetch(`/api/points/wallet?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar carteira de pontos.');
    return res.json();
  },

  // Iniciar compra de pontos via PIX
  async buyPointsPix(data: {
    userId?: string;
    name?: string;
    email?: string;
    cpf?: string;
    valorReais: number;
    idempotencyKey?: string;
  }): Promise<{ request: PointsRequest; qrCodePayload: string; copiaECola: string }> {
    const res = await fetch('/api/points/buy-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar compra PIX.');
    }
    return res.json();
  },

  // Confirmar pagamento PIX (Webhook / simulação)
  async confirmPixPayment(requestId: string, idempotencyKey?: string): Promise<{
    success: boolean;
    wallet: UserPointsWallet;
    ledgerEntry: PointsLedgerEntry;
  }> {
    const res = await fetch('/api/points/confirm-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, idempotencyKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao confirmar pagamento PIX.');
    }
    return res.json();
  },

  // Pagamento em parceiro com pontos
  async payPartnerWithPoints(data: {
    userId?: string;
    name?: string;
    email?: string;
    partnerId: string;
    partnerName: string;
    offerId: string;
    offerTitle: string;
    discountValue: string;
    pontosValor: number;
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    wallet: UserPointsWallet;
    ledgerEntry: PointsLedgerEntry;
    voucherCode: string;
  }> {
    const res = await fetch('/api/points/pay-partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao pagar com pontos.');
    }
    return res.json();
  },

  // Solicitar saque / liquidação financeira via PIX
  async redeemPixWithdrawal(data: {
    userId?: string;
    name?: string;
    email?: string;
    cpf?: string;
    pontosValor: number;
    chavePix: { tipo: 'cpf' | 'email' | 'telefone' | 'aleatoria'; chave: string; banco?: string };
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    request: PointsRequest;
    wallet: UserPointsWallet;
    executadoAutomaticamente: boolean;
  }> {
    const res = await fetch('/api/points/redeem-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao solicitar saque PIX.');
    }
    return res.json();
  },

  // Emitir cartão pré-pago
  async issuePrepaidCard(data: {
    userId?: string;
    name?: string;
    email?: string;
    cpf?: string;
    tipo: 'virtual' | 'fisico';
    valorCarga: number;
    enderecoEntrega?: PointsPrepaidCard['endereco_entrega'];
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    card: PointsPrepaidCard;
    wallet: UserPointsWallet;
  }> {
    const res = await fetch('/api/points/prepaid-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao emitir cartão.');
    }
    return res.json();
  },

  // ================= ADMIN SERVICES =================

  async getMotherAccount(): Promise<MotherAccountState> {
    const res = await fetch('/api/points/admin/mother-account');
    if (!res.ok) throw new Error('Falha ao carregar estado da Conta Mãe.');
    return res.json();
  },

  async getPendingApprovals(): Promise<PointsRequest[]> {
    const res = await fetch('/api/points/admin/approvals');
    if (!res.ok) throw new Error('Falha ao carregar fila de aprovações.');
    return res.json();
  },

  async decideApproval(
    requestId: string,
    decision: 'aprovado' | 'rejeitado',
    approver: AdminUser,
    motivo?: string
  ): Promise<{ success: boolean; request: PointsRequest; wallet: UserPointsWallet }> {
    const res = await fetch(`/api/points/admin/approvals/${requestId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, approver, motivo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar decisão.');
    }
    return res.json();
  },

  async getLedger(filters?: { usuario_id?: string; operacao?: string; limit?: number }): Promise<PointsLedgerEntry[]> {
    const params = new URLSearchParams();
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id);
    if (filters?.operacao) params.append('operacao', filters.operacao);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`/api/points/admin/ledger?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar Ledger.');
    return res.json();
  },

  async runTimeTravel(targetDate: string, usuarioId?: string): Promise<TimeTravelSnapshot> {
    const res = await fetch('/api/points/admin/time-travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDate, usuarioId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha no Time Travel.');
    }
    return res.json();
  },

  async runReplaySimulation(): Promise<ReplaySimulationResult> {
    const res = await fetch('/api/points/admin/replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Falha ao executar Replay de Produção.');
    return res.json();
  },

  async updatePointsRate(novaTaxa: number, motivo: string, usuarioId?: string, executor?: AdminUser): Promise<{ success: boolean; history: PointsRateHistory }> {
    const res = await fetch('/api/points/admin/update-rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novaTaxa, motivo, usuarioId, executor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar taxa.');
    }
    return res.json();
  },

  async getRiskAlerts(): Promise<PointsRiskAlert[]> {
    const res = await fetch('/api/points/admin/risk-alerts');
    if (!res.ok) throw new Error('Falha ao carregar alertas de risco.');
    return res.json();
  },

  async getAuditLog(): Promise<PointsAuditEntry[]> {
    const res = await fetch('/api/points/admin/audit');
    if (!res.ok) throw new Error('Falha ao carregar auditoria.');
    return res.json();
  },

  async getAllWallets(): Promise<UserPointsWallet[]> {
    const res = await fetch('/api/points/admin/wallets');
    if (!res.ok) throw new Error('Falha ao carregar carteiras.');
    return res.json();
  },

  async getDatabaseSchema(): Promise<any> {
    const res = await fetch('/api/points/admin/database-schema');
    if (!res.ok) throw new Error('Falha ao carregar estrutura do banco de dados.');
    return res.json();
  },
};
