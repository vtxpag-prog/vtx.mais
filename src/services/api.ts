import {
  Offer,
  Partner,
  Lead,
  CRMConfig,
  CRMLog,
  CRMHealthReport,
  OfferReview,
  ReviewsReport,
  AnalyticsStats,
  UserSessionData,
  FilterType,
  CategoryName,
  AdminUser,
  CustomerUser,
  AdvertiserLead,
  AdvertiserKanbanStage,
  LeadContactStage,
  LeadNote,
  TopBanner,
  PushNotification,
  MediaItem,
  WeeklyPushSchedule,
  PushSendHistoryLog,
  CouponValidation,
  PartnerSettlement,
  PartnerPOSStats,
} from '../types';
import { SEED_OFFERS, SEED_PARTNERS } from '../server/seedData';

const STORAGE_SESSION_KEY = 'vtxmais_user_session';
const STORAGE_USER_CEP_KEY = 'vtxmais_user_cep';
const STORAGE_FAVORITES_KEY = 'vtxmais_favorite_offers';

export const favoritesService = {
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(offerId: string): boolean {
    const list = this.getFavorites();
    return list.includes(offerId);
  },

  toggleFavorite(offerId: string): string[] {
    try {
      const list = this.getFavorites();
      let updated: string[];
      if (list.includes(offerId)) {
        updated = list.filter((id) => id !== offerId);
      } else {
        updated = [...list, offerId];
      }
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },
};

export const sessionService = {
  getStoredUser(): UserSessionData | null {
    try {
      const data = localStorage.getItem(STORAGE_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveUser(userData: { name: string; phone: string; email: string; cpf?: string; userCep?: string }) {
    const data: UserSessionData = {
      ...userData,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data));
      if (userData.userCep) {
        localStorage.setItem(STORAGE_USER_CEP_KEY, userData.userCep);
      }
    } catch {
      // Ignore localStorage issues
    }
  },

  clearUser() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {}
  },

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {}
  },

  getSavedCep(): string {
    try {
      return localStorage.getItem(STORAGE_USER_CEP_KEY) || '';
    } catch {
      return '';
    }
  },

  setSavedCep(cep: string) {
    try {
      if (!cep || !cep.trim()) {
        localStorage.removeItem(STORAGE_USER_CEP_KEY);
      } else {
        localStorage.setItem(STORAGE_USER_CEP_KEY, cep);
      }
    } catch {}
  },

  clearSavedCep() {
    try {
      localStorage.removeItem(STORAGE_USER_CEP_KEY);
    } catch {}
  }
};

const STORAGE_USER_COUPONS_KEY = 'vtxmais_user_redeemed_coupons';

export type CouponValidityStatus = 'valido' | 'expirando' | 'utilizado' | 'expirado';

export interface RedeemedUserCoupon {
  id: string;
  offerId: string;
  offerTitle: string;
  partnerName: string;
  partnerLogo?: string;
  category: string;
  couponCode: string;
  discountValue: string;
  calculatedSavings: number;
  redeemedAt: string;
  validUntil: string;
  status: 'valido' | 'utilizado' | 'expirado';
  usedAt?: string;
  terms?: string;
  voucherType?: 'online' | 'presencial';
  userEmail?: string;
  userId?: string;
}

export const userCouponsService = {
  calculateSavings(discountValue: string, category?: string): number {
    if (!discountValue) return 50;

    // 1. Direct R$ values (e.g. "R$ 350 OFF", "R$ 150 OFF", "R$ 200 OFF")
    const realMatch = discountValue.match(/R\$\s*([\d.,]+)/i);
    if (realMatch) {
      const cleanNum = realMatch[1].replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 2. Courtesy / Gift items
    const lower = discountValue.toLowerCase();
    if (lower.includes('cortesia') || lower.includes('grátis') || lower.includes('brinde')) {
      if (lower.includes('onion')) return 68.9;
      if (lower.includes('pipoca') || lower.includes('ingresso')) return 42.0;
      return 55.0;
    }

    // 3. Percentage values based on category basket
    const percentMatch = discountValue.match(/(\d+)%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1], 10);
      let basket = 250;
      if (category) {
        const cat = category.toLowerCase();
        if (cat.includes('eletro') || cat.includes('tecnologia')) basket = 1200;
        else if (cat.includes('viagen')) basket = 1800;
        else if (cat.includes('educa')) basket = 400;
        else if (cat.includes('comer') || cat.includes('gastronomia')) basket = 220;
        else if (cat.includes('moda') || cat.includes('calçado')) basket = 300;
        else if (cat.includes('saúde') || cat.includes('beleza')) basket = 200;
        else if (cat.includes('cultura') || cat.includes('cinema')) basket = 90;
      }
      return Math.round((percent / 100) * basket * 10) / 10;
    }

    const anyNum = discountValue.match(/\d+/);
    return anyNum ? parseFloat(anyNum[0]) : 50;
  },

  getValidityInfo(coupon: RedeemedUserCoupon): {
    status: CouponValidityStatus;
    label: string;
    badgeClass: string;
    bgClass: string;
    borderClass: string;
    textColor: string;
    daysLeft: number;
    isUsable: boolean;
  } {
    if (coupon.status === 'utilizado') {
      return {
        status: 'utilizado',
        label: 'Utilizado no Parceiro',
        badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-200/80',
        bgClass: 'bg-blue-50/50',
        borderClass: 'border-blue-200',
        textColor: 'text-blue-700',
        daysLeft: 0,
        isUsable: false,
      };
    }

    const now = new Date().getTime();
    const expiry = new Date(coupon.validUntil || '2026-10-30T23:59:59Z').getTime();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || coupon.status === 'expirado') {
      return {
        status: 'expirado',
        label: 'Voucher Expirado',
        badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-200/80',
        bgClass: 'bg-rose-50/40',
        borderClass: 'border-rose-200',
        textColor: 'text-rose-700',
        daysLeft: diffDays,
        isUsable: false,
      };
    }

    if (diffDays <= 4) {
      return {
        status: 'expirando',
        label: `Expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}!`,
        badgeClass: 'bg-amber-500/20 text-amber-900 border-amber-300 font-extrabold shadow-2xs',
        bgClass: 'bg-amber-50/50',
        borderClass: 'border-amber-300',
        textColor: 'text-amber-800',
        daysLeft: diffDays,
        isUsable: true,
      };
    }

    return {
      status: 'valido',
      label: `Válido (${diffDays} dias restantes)`,
      badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-200 font-bold',
      bgClass: 'bg-emerald-50/40',
      borderClass: 'border-emerald-200',
      textColor: 'text-emerald-700',
      daysLeft: diffDays,
      isUsable: true,
    };
  },

  getInitialSampleCoupons(userKey: string = 'default'): RedeemedUserCoupon[] {
    return [
      {
        id: `cp_init_1_${userKey}`,
        offerId: 'off_fastshop_tv',
        offerTitle: 'R$ 350 OFF em Smart TVs OLED e Linha Branca Premium',
        partnerName: 'Fast Shop',
        partnerLogo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=160&q=80',
        category: 'Eletrodomésticos e Eletrônicos',
        couponCode: 'VTX-FAST350',
        discountValue: 'R$ 350 OFF',
        calculatedSavings: 350.0,
        redeemedAt: '2026-09-28T14:30:00Z',
        validUntil: '2026-10-28T23:59:59Z',
        status: 'valido',
        voucherType: 'online',
        terms: 'Válido para compras online no site oficial da Fast Shop acima de R$ 1.999. Inserir no checkout.',
      },
      {
        id: `cp_init_2_${userKey}`,
        offerId: 'off_outback_bloomin',
        offerTitle: 'Bloomin’ Onion Cortesia na Compra de Prato Principal',
        partnerName: 'Outback Steakhouse',
        partnerLogo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80',
        category: 'Comer e Beber',
        couponCode: 'VTX-OUTBACKONION',
        discountValue: 'Cortesia Bloomin’ Onion',
        calculatedSavings: 68.9,
        redeemedAt: '2026-09-25T19:15:00Z',
        validUntil: '2026-10-02T23:59:59Z', // Expiring in 2 days!
        status: 'valido',
        voucherType: 'presencial',
        terms: 'Válido de segunda a quinta-feira em qualquer restaurante Outback do Brasil. Apresente o código ao garçom.',
      },
      {
        id: `cp_init_3_${userKey}`,
        offerId: 'off_samsung_galaxy',
        offerTitle: '20% de Desconto na Linha Galaxy S e Acessórios Oficiais',
        partnerName: 'Samsung Store',
        partnerLogo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=160&q=80',
        category: 'Eletrodomésticos e Eletrônicos',
        couponCode: 'VTX-SAMSUNG20',
        discountValue: '20% OFF',
        calculatedSavings: 240.0,
        redeemedAt: '2026-09-22T11:40:00Z',
        validUntil: '2026-10-22T23:59:59Z',
        status: 'utilizado',
        usedAt: '2026-09-26T16:45:00Z',
        voucherType: 'online',
        terms: 'Desconto aplicado com sucesso no pedido #SS-98213. Economia de R$ 240,00 garantida.',
      },
      {
        id: `cp_init_4_${userKey}`,
        offerId: 'off_drogaraia_dermo',
        offerTitle: '30% OFF em Dermocosméticos e Protetores Solares',
        partnerName: 'Droga Raia',
        partnerLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=160&q=80',
        category: 'Saúde e Beleza',
        couponCode: 'VTX-RAIA30',
        discountValue: '30% OFF',
        calculatedSavings: 60.0,
        redeemedAt: '2026-09-20T16:20:00Z',
        validUntil: '2026-10-20T23:59:59Z',
        status: 'valido',
        voucherType: 'presencial',
        terms: 'Apresente o código no caixa físico de qualquer farmácia Droga Raia ou informe seu CPF cadastrado.',
      },
      {
        id: `cp_init_5_${userKey}`,
        offerId: 'off_cinemark_prime',
        offerTitle: '50% OFF no Ingresso Cinemark Prime e Pipoca Média',
        partnerName: 'Cinemark Prime',
        partnerLogo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=160&q=80',
        category: 'Cultura e Lazer',
        couponCode: 'VTX-CINEMA50',
        discountValue: '50% OFF',
        calculatedSavings: 45.0,
        redeemedAt: '2026-08-15T18:00:00Z',
        validUntil: '2026-09-15T23:59:59Z', // Expired
        status: 'expirado',
        voucherType: 'online',
        terms: 'Válido para compras antecipadas no aplicativo Cinemark. Prazo limite encerrado em 15/09/2026.',
      },
    ];
  },

  getRedeemedCoupons(userKey: string = 'default'): RedeemedUserCoupon[] {
    try {
      const storageKey = `${STORAGE_USER_COUPONS_KEY}_${userKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const initial = this.getInitialSampleCoupons(userKey);
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    } catch {
      return this.getInitialSampleCoupons(userKey);
    }
  },

  addRedeemedCoupon(
    userKey: string,
    couponData: {
      offerId: string;
      offerTitle: string;
      partnerName: string;
      partnerLogo?: string;
      category: string;
      couponCode: string;
      discountValue: string;
      validUntil?: string;
      terms?: string;
      voucherType?: 'online' | 'presencial';
    }
  ): RedeemedUserCoupon {
    const savings = this.calculateSavings(couponData.discountValue, couponData.category);
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    const newCoupon: RedeemedUserCoupon = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...couponData,
      calculatedSavings: savings,
      redeemedAt: new Date().toISOString(),
      validUntil: couponData.validUntil || validUntilDate.toISOString(),
      status: 'valido',
      voucherType: couponData.voucherType || 'online',
      terms: couponData.terms || 'Apresente este código no caixa ou insira no carrinho do parceiro antes de finalizar o pedido.',
    };

    try {
      const storageKey = `${STORAGE_USER_COUPONS_KEY}_${userKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const current = this.getRedeemedCoupons(userKey);
      const updated = [newCoupon, ...current];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save redeemed coupon in localStorage', err);
    }

    return newCoupon;
  },

  toggleCouponUsed(userKey: string, couponId: string): RedeemedUserCoupon[] {
    try {
      const storageKey = `${STORAGE_USER_COUPONS_KEY}_${userKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const current = this.getRedeemedCoupons(userKey);
      const updated = current.map((c) => {
        if (c.id === couponId) {
          const isCurrentlyUsed = c.status === 'utilizado';
          return {
            ...c,
            status: isCurrentlyUsed ? 'valido' : 'utilizado',
            usedAt: isCurrentlyUsed ? undefined : new Date().toISOString(),
          } as RedeemedUserCoupon;
        }
        return c;
      });
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  calculateTotalSavings(coupons: RedeemedUserCoupon[]): number {
    return coupons.reduce((sum, item) => sum + (item.calculatedSavings || 0), 0);
  }
};

export const api = {
  // ===================== CEP =====================
  async getCep(cep: string) {
    const res = await fetch(`/api/cep/${cep}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'CEP não encontrado');
    }
    return res.json();
  },

  // ===================== OFFERS =====================
  async getOffers(params?: {
    search?: string;
    category?: string;
    filter?: FilterType;
    cep?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ offers: Offer[]; total: number; userLocation?: any }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.category) query.append('category', params.category);
      if (params?.filter) query.append('filter', params.filter);
      if (params?.cep) query.append('cep', params.cep);
      if (params?.lat !== undefined) query.append('lat', params.lat.toString());
      if (params?.lng !== undefined) query.append('lng', params.lng.toString());

      const res = await fetch(`/api/offers?${query.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.offers)) {
            return data;
          }
        }
      }
    } catch (err) {
      console.warn('API /api/offers unavailable or non-JSON, using resilient fallback:', err);
    }

    // Resilient fallback using SEED_OFFERS
    let filtered = [...SEED_OFFERS];
    if (params?.category && params.category !== 'Todos') {
      filtered = filtered.filter((o) => o.category === params.category);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.partnerName.toLowerCase().includes(q)
      );
    }
    return {
      offers: filtered,
      total: filtered.length,
      userLocation: null,
    };
  },

  async getAllOffersAdmin(): Promise<Offer[]> {
    try {
      const res = await fetch('/api/offers/all');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      }
    } catch (err) {
      console.warn('getAllOffersAdmin fallback:', err);
    }
    return [...SEED_OFFERS];
  },

  async getOfferById(id: string): Promise<Offer> {
    try {
      const res = await fetch(`/api/offers/${id}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        }
      }
    } catch {}
    const found = SEED_OFFERS.find((o) => o.id === id);
    if (found) return found;
    throw new Error('Oferta não encontrada');
  },

  async recordView(offerId: string) {
    try {
      await fetch(`/api/offers/${offerId}/view`, { method: 'POST' });
    } catch {}
  },

  async createOffer(offerData: Partial<Offer>): Promise<Offer> {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar oferta');
    }
    return res.json();
  },

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar oferta');
    }
    return res.json();
  },

  async deleteOffer(id: string): Promise<boolean> {
    const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir oferta');
    return true;
  },

  // ===================== PARTNERS =====================
  async getPartners(): Promise<Partner[]> {
    try {
      const res = await fetch('/api/partners');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        }
      }
    } catch (err) {
      console.warn('getPartners fallback:', err);
    }
    return [...SEED_PARTNERS];
  },

  async createPartner(partnerData: Partial<Partner>): Promise<Partner> {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnerData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar parceiro');
    }
    return res.json();
  },

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    const res = await fetch(`/api/partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar parceiro');
    }
    return res.json();
  },

  async deletePartner(id: string): Promise<boolean> {
    const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir parceiro');
    return true;
  },

  // ===================== LEADS & COUPONS =====================
  async claimCoupon(data: {
    name: string;
    phone: string;
    email: string;
    offerId: string;
    userCep?: string;
  }): Promise<{
    success: boolean;
    message: string;
    lead: Lead;
    couponCode: string;
    offer: Offer;
  }> {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Falha ao resgatar cupom.');
    }

    // Save lead data in session for subsequent 1-click unlocks
    sessionService.saveUser({
      name: data.name,
      phone: data.phone,
      email: data.email,
      userCep: data.userCep,
    });

    return body;
  },

  async getLeads(params?: {
    search?: string;
    category?: string;
    couponCode?: string;
    period?: number;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.couponCode) query.append('couponCode', params.couponCode);
    if (params?.period) query.append('period', params.period.toString());

    const res = await fetch(`/api/leads?${query.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar leads');
    return res.json();
  },

  getLeadsCsvUrl(params?: { search?: string; category?: string; couponCode?: string; period?: number }): string {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.couponCode) query.append('couponCode', params.couponCode);
    if (params?.period) query.append('period', params.period.toString());
    return `/api/leads/export/csv?${query.toString()}`;
  },

  async updateLeadStage(
    id: string,
    stage: LeadContactStage,
    note?: string,
    author?: string
  ): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, note, author }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar fase do contato');
    return res.json();
  },

  async addLeadNote(id: string, text: string, author?: string): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    if (!res.ok) throw new Error('Falha ao adicionar nota ao lead');
    return res.json();
  },

  // ===================== CRM =====================
  async getCrmConfig(): Promise<CRMConfig> {
    const res = await fetch('/api/crm/config');
    if (!res.ok) throw new Error('Falha ao obter configuração do CRM');
    return res.json();
  },

  async updateCrmConfig(config: Partial<CRMConfig>): Promise<CRMConfig> {
    const res = await fetch('/api/crm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Falha ao atualizar configuração do CRM');
    return res.json();
  },

  async testCrmConnection(webhookUrl?: string, apiKey?: string): Promise<{ success: boolean; message: string; payloadSent: any }> {
    const res = await fetch('/api/crm/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, apiKey }),
    });
    if (!res.ok) throw new Error('Falha ao executar teste do CRM');
    return res.json();
  },

  async getCrmLogs(): Promise<CRMLog[]> {
    const res = await fetch('/api/crm/logs');
    if (!res.ok) return [];
    return res.json();
  },

  async getCrmHealth(): Promise<CRMHealthReport> {
    const res = await fetch('/api/crm/health');
    if (!res.ok) throw new Error('Falha ao obter status de saúde do CRM');
    return res.json();
  },

  async testCrmHealth(customUrl?: string, customKey?: string): Promise<CRMHealthReport> {
    const res = await fetch('/api/crm/health/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customUrl, customKey }),
    });
    if (!res.ok) throw new Error('Falha ao executar teste de saúde do webhook');
    return res.json();
  },

  // ===================== AVALIAÇÕES & RATINGS =====================
  async getReviews(offerId?: string, rating?: number): Promise<OfferReview[]> {
    let url = '/api/reviews';
    const params = new URLSearchParams();
    if (offerId) params.append('offerId', offerId);
    if (rating) params.append('rating', String(rating));
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async submitReview(data: {
    offerId: string;
    rating: number;
    comment?: string;
    userName?: string;
    userEmail?: string;
    userCity?: string;
    couponCode?: string;
    verifiedRedemption?: boolean;
    userId?: string;
  }): Promise<{ review: OfferReview; offer: Offer }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao enviar avaliação');
    }
    return res.json();
  },

  async getReviewsReport(): Promise<ReviewsReport> {
    const res = await fetch('/api/reviews/report');
    if (!res.ok) throw new Error('Falha ao obter relatório descritivo de avaliações');
    return res.json();
  },

  // ===================== ANALYTICS =====================
  async getAnalytics(): Promise<AnalyticsStats> {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Falha ao carregar relatórios');
    return res.json();
  },

  // ===================== AUTH =====================
  async login(identifier: string, pass: string): Promise<{ user: AdminUser; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, email: identifier, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciais inválidas');
    }
    return res.json();
  },

  async completeProfile(userId: string, data: { name: string; cpf: string; dataNascimento: string; email: string }): Promise<{ success: boolean; user: AdminUser }> {
    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao completar cadastro');
    }
    return res.json();
  },

  async changePassword(userId: string, newPassword: string): Promise<{ success: boolean; user: AdminUser; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao alterar senha');
    }
    return res.json();
  },

  async getUsers(): Promise<AdminUser[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) return [];
    return res.json();
  },

  // ===================== CUSTOMERS / RECOGNITION =====================
  async lookupCustomer(identifier: string): Promise<{ success: boolean; customer: CustomerUser }> {
    const res = await fetch('/api/customers/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cadastro não localizado.');
    return data;
  },

  async registerCustomer(payload: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
    userCep?: string;
    offerId?: string;
  }): Promise<{ success: boolean; customer: CustomerUser }> {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar cliente.');
    return data;
  },

  async getCustomers(): Promise<CustomerUser[]> {
    const res = await fetch('/api/customers');
    if (!res.ok) return [];
    return res.json();
  },

  // ===================== ADVERTISERS & CRM KANBAN =====================
  async submitAdvertiser(payload: {
    companyName: string;
    tradeName?: string;
    cnpj?: string;
    contactName: string;
    email: string;
    phone: string;
    category?: CategoryName;
    city?: string;
    state?: string;
    discountProposal?: string;
  }): Promise<{ success: boolean; message: string; advertiser: AdvertiserLead }> {
    const res = await fetch('/api/advertisers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar proposta da empresa.');
    return data;
  },

  async getAdvertisers(): Promise<AdvertiserLead[]> {
    const res = await fetch('/api/advertisers');
    if (!res.ok) return [];
    return res.json();
  },

  async updateAdvertiserStage(id: string, stage: AdvertiserKanbanStage): Promise<AdvertiserLead> {
    const res = await fetch(`/api/advertisers/${id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar estágio do anunciante.');
    return res.json();
  },

  async addAdvertiserNote(id: string, note: string): Promise<AdvertiserLead> {
    const res = await fetch(`/api/advertisers/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Falha ao registrar nota.');
    return res.json();
  },

  async deleteAdvertiser(id: string): Promise<boolean> {
    const res = await fetch(`/api/advertisers/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // ===================== TOP CAROUSEL BANNERS =====================
  async getBanners(): Promise<TopBanner[]> {
    const res = await fetch('/api/banners');
    if (!res.ok) return [];
    return res.json();
  },

  async addBanner(data: Omit<TopBanner, 'id'>): Promise<TopBanner> {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao adicionar banner.');
    return res.json();
  },

  async updateBanner(id: string, updates: Partial<TopBanner>): Promise<TopBanner> {
    const res = await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar banner.');
    return res.json();
  },

  async deleteBanner(id: string): Promise<boolean> {
    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // ===================== MEDIA / PHOTO DATABASE =====================
  async getMediaItems(): Promise<MediaItem[]> {
    const res = await fetch('/api/media');
    if (!res.ok) return [];
    return res.json();
  },

  async getMediaStats(): Promise<{
    totalItems: number;
    activeItems: number;
    suspendedItems: number;
    totalBytes: number;
    totalMegabytes: string;
  }> {
    const res = await fetch('/api/media/stats');
    if (!res.ok) {
      return { totalItems: 0, activeItems: 0, suspendedItems: 0, totalBytes: 0, totalMegabytes: '0.00' };
    }
    return res.json();
  },

  // ===================== PUSH NOTIFICATIONS & SLA =====================
  async getNotifications(): Promise<PushNotification[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    return res.ok;
  },

  async markAllNotificationsAsRead(): Promise<boolean> {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    return res.ok;
  },

  // ===================== WEEKLY PUSH SCHEDULES =====================
  async getPushSchedules(): Promise<WeeklyPushSchedule[]> {
    const res = await fetch('/api/push-schedules');
    if (!res.ok) return [];
    return res.json();
  },

  async getPushHistory(): Promise<PushSendHistoryLog[]> {
    const res = await fetch('/api/push-schedules/history');
    if (!res.ok) return [];
    return res.json();
  },

  async createPushSchedule(data: {
    title: string;
    body: string;
    targetAudience: string;
    daysOfWeek: number[];
    timeOfDay: string;
    active?: boolean;
    offerId?: string;
    createdBy?: string;
  }): Promise<WeeklyPushSchedule> {
    const res = await fetch('/api/push-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar agendamento');
    }
    return res.json();
  },

  async updatePushSchedule(id: string, updates: Partial<WeeklyPushSchedule>): Promise<WeeklyPushSchedule> {
    const res = await fetch(`/api/push-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Erro ao atualizar agendamento');
    return res.json();
  },

  async togglePushSchedule(id: string): Promise<WeeklyPushSchedule> {
    const res = await fetch(`/api/push-schedules/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Erro ao alterar status');
    return res.json();
  },

  async deletePushSchedule(id: string): Promise<boolean> {
    const res = await fetch(`/api/push-schedules/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async triggerPushSchedule(id: string): Promise<{ schedule: WeeklyPushSchedule; log: PushSendHistoryLog }> {
    const res = await fetch(`/api/push-schedules/${id}/trigger`, { method: 'POST' });
    if (!res.ok) throw new Error('Erro ao disparar notificação');
    return res.json();
  },

  // ===================== FASE 12: PORTAL DO LOJISTA (POS) & CLEARING HOUSE =====================
  async getValidations(params?: {
    partnerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<CouponValidation[]> {
    const q = new URLSearchParams();
    if (params?.partnerId) q.append('partnerId', params.partnerId);
    if (params?.status) q.append('status', params.status);
    if (params?.dateFrom) q.append('dateFrom', params.dateFrom);
    if (params?.dateTo) q.append('dateTo', params.dateTo);
    if (params?.search) q.append('search', params.search);

    const res = await fetch(`/api/partner/validations?${q.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async validateCouponPOS(data: {
    couponCode: string;
    partnerId: string;
    billAmount?: number;
    pointsUsed?: number;
    operatorName?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    validation: CouponValidation;
    offer: Offer;
    discountAmount: number;
    netPaid: number;
    message: string;
  }> {
    const res = await fetch('/api/partner/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Falha ao validar cupom.');
    return body;
  },

  async cancelValidation(id: string): Promise<boolean> {
    const res = await fetch(`/api/partner/validations/${id}/cancel`, { method: 'POST' });
    return res.ok;
  },

  async getPartnerPOSStats(partnerId: string): Promise<PartnerPOSStats> {
    const res = await fetch(`/api/partner/stats/${partnerId}`);
    if (!res.ok) {
      return {
        partnerId,
        partnerName: 'Parceiro',
        validationsToday: 0,
        grossVolumeToday: 0,
        discountGivenToday: 0,
        totalValidationsMonth: 0,
        pendingSettlementAmount: 0,
      };
    }
    return res.json();
  },

  async getSettlements(params?: { partnerId?: string; status?: string }): Promise<PartnerSettlement[]> {
    const q = new URLSearchParams();
    if (params?.partnerId) q.append('partnerId', params.partnerId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`/api/settlements?${q.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async generateSettlement(data: {
    partnerId: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<{ success: boolean; message: string; settlement: PartnerSettlement }> {
    const res = await fetch('/api/settlements/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Falha ao gerar fechamento.');
    return body;
  },

  async settlePayout(
    id: string,
    approverName?: string,
    pixTransactionId?: string
  ): Promise<{ success: boolean; message: string; settlement: PartnerSettlement }> {
    const res = await fetch(`/api/settlements/${id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverName, pixTransactionId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Falha ao liquidar repasse.');
    return body;
  },

  async convertAdvertiserToPartner(advertiserId: string): Promise<{
    success: boolean;
    message: string;
    partner: Partner;
    offer: Offer;
    advertiser: AdvertiserLead;
  }> {
    const res = await fetch(`/api/advertisers/${advertiserId}/convert-to-partner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Falha ao converter anunciante em parceiro.');
    return body;
  }
};

export { pointsService } from './pointsService';


