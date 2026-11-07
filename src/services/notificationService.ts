// Notification Service for Clube VTXMais - Service Worker & Local Regional Alerts
import { Offer } from '../types';
import { formatCep, formatDistance } from '../utils/geo';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  offerId?: string;
  partnerName?: string;
  partnerLogo?: string;
  discountValue?: string;
  distanceKm?: number;
  userCep?: string;
  createdAt: string;
  read: boolean;
  type: 'nearby_offer' | 'system' | 'voucher' | 'points_credit' | 'points_withdrawal';
}

export interface NotificationPreferences {
  enabled: boolean;
  maxDistanceKm: number;
  soundEnabled: boolean;
  browserNativeEnabled: boolean;
}

const STORAGE_PREFS_KEY = 'vtxmais_notification_prefs';
const STORAGE_HISTORY_KEY = 'vtxmais_notifications_history';
const STORAGE_NOTIFIED_IDS_KEY = 'vtxmais_notified_offer_ids';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  maxDistanceKm: 15,
  soundEnabled: true,
  browserNativeEnabled: true,
};

type NotificationSubscriber = (notification: AppNotification) => void;

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscribers: Set<NotificationSubscriber> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Initializes Service Worker and loads preferences
   */
  public async init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Register Service Worker if supported
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        this.swRegistration = registration;
        console.log('[NotificationService] Service Worker registered with scope:', registration.scope);
      } catch (err) {
        console.warn('[NotificationService] Service Worker registration failed (normal in restricted iframes):', err);
      }
    }
  }

  /**
   * Subscribe to real-time notification alerts (for in-app toasts & bell updates)
   */
  public subscribe(cb: NotificationSubscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notifySubscribers(notification: AppNotification) {
    this.subscribers.forEach((cb) => {
      try {
        cb(notification);
      } catch (e) {
        console.error('[NotificationService] Subscriber callback error:', e);
      }
    });
  }

  /**
   * Returns current browser notification permission state
   */
  public getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Requests permission for native browser notifications
   */
  public async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('[NotificationService] Notification permission request rejected/restricted:', err);
      return Notification.permission || 'denied';
    }
  }

  /**
   * Retrieves user notification preferences
   */
  public getPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_PREFS_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {}
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Updates user notification preferences
   */
  public savePreferences(prefs: Partial<NotificationPreferences>) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Retrieves saved in-app notification history
   */
  public getHistory(): AppNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    // Initial mock history if empty for good UX
    const initial: AppNotification[] = [
      {
        id: 'notif_welcome',
        title: '🔔 Bem-vindo ao Clube VTXMais!',
        body: 'Informe seu CEP para receber avisos automáticos de novas ofertas de parceiros na sua região.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        read: false,
        type: 'system',
      },
    ];
    return initial;
  }

  /**
   * Saves notification history to localStorage
   */
  private saveHistory(history: AppNotification[]) {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {}
  }

  /**
   * Marks a specific notification as read
   */
  public markAsRead(id: string) {
    const history = this.getHistory().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveHistory(history);
  }

  /**
   * Marks all notifications as read
   */
  public markAllAsRead() {
    const history = this.getHistory().map((n) => ({ ...n, read: true }));
    this.saveHistory(history);
  }

  /**
   * Clears notification history
   */
  public clearHistory() {
    try {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
    } catch {}
  }

  /**
   * Synthesizes a clean, pleasant 2-tone notification sound via Web Audio API (Offline & Zero-asset)
   */
  public playChime() {
    const prefs = this.getPreferences();
    if (!prefs.soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.28);

      // Tone 2: 880 Hz (A5) slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio playback might be restricted if no user interaction yet
    }
  }

  /**
   * Dispatches a notification to:
   * 1. Service Worker / Native Notification API
   * 2. In-App Notification Store & Toast subscribers
   */
  public async dispatchNotification(notification: AppNotification) {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return;

    // 1. Persist to history
    const history = this.getHistory();
    // Avoid duplicate IDs
    const exists = history.some((n) => n.id === notification.id);
    if (!exists) {
      this.saveHistory([notification, ...history]);
    }

    // 2. Play audio feedback
    this.playChime();

    // 3. Emit in-app event to subscribers (for toasts & reactive UI)
    this.notifySubscribers(notification);

    // 4. Try native Browser / Service Worker notification
    if (prefs.browserNativeEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const options: NotificationOptions & { vibrate?: number[] } = {
          body: notification.body,
          icon: notification.partnerLogo || '/logo_vtx_mais.png',
          badge: '/logo_vtx_mais.png',
          vibrate: [150, 80, 150],
          data: {
            url: notification.offerId ? `/?offer=${notification.offerId}` : '/',
            offerId: notification.offerId,
          },
        };

        try {
          // Try through Service Worker first for background/offline capabilities
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification(notification.title, options);
              return;
            }
          }
          // Fallback to standard new Notification
          new Notification(notification.title, options);
        } catch (err) {
          console.warn('[NotificationService] Native notification dispatch error:', err);
        }
      }
    }
  }

  /**
   * Scans offers against the user's saved CEP and triggers alerts for new nearby partner offers
   */
  public checkNearbyOffers(offers: Offer[], userCep: string): AppNotification[] {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !userCep || !offers || offers.length === 0) {
      return [];
    }

    // Get list of already notified offer IDs to avoid spamming the user on every render
    let notifiedIds: string[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_NOTIFIED_IDS_KEY);
      if (stored) notifiedIds = JSON.parse(stored);
    } catch {}

    // Find offers within max distance that have distanceKm calculated
    const nearbyOffers = offers
      .filter((o) => {
        if (o.distanceKm === undefined || isNaN(o.distanceKm)) return false;
        return o.distanceKm <= prefs.maxDistanceKm;
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    if (nearbyOffers.length === 0) return [];

    // Check which ones haven't been notified yet
    const unnotified = nearbyOffers.filter((o) => !notifiedIds.includes(o.id));

    // If all were notified or this is the first run, take the closest 1 or 2 new offers
    const offersToAlert = unnotified.slice(0, 2);
    const triggered: AppNotification[] = [];

    offersToAlert.forEach((offer) => {
      const distStr = formatDistance(offer.distanceKm);
      const notif: AppNotification = {
        id: `notif_${offer.id}_${Date.now()}`,
        title: `📍 Nova Oferta a ${distStr} de você!`,
        body: `${offer.partnerName}: ${offer.title} com ${offer.discountValue}.`,
        offerId: offer.id,
        partnerName: offer.partnerName,
        partnerLogo: offer.partnerLogo,
        discountValue: offer.discountValue,
        distanceKm: offer.distanceKm,
        userCep: userCep,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'nearby_offer',
      };

      this.dispatchNotification(notif);
      triggered.push(notif);
      notifiedIds.push(offer.id);
    });

    // Save updated notified IDs
    try {
      localStorage.setItem(STORAGE_NOTIFIED_IDS_KEY, JSON.stringify(notifiedIds));
    } catch {}

    return triggered;
  }

  /**
   * Simulates or triggers a test notification for the user's region
   */
  public triggerTestNotification(sampleOffer?: Offer, userCep?: string): AppNotification {
    const cep = userCep || '01310-100';
    const offer = sampleOffer || {
      id: 'off_test_nearby',
      partnerName: 'Outback Steakhouse',
      partnerLogo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80',
      title: 'Ganhe 1 Bloomin’ Onion na compra de prato principal',
      discountValue: 'CORTESIA',
      distanceKm: 0.8,
    };

    const notif: AppNotification = {
      id: `notif_test_${Date.now()}`,
      title: `⚡ Teste de Notificação: Oferta a ${formatDistance(offer.distanceKm || 0.8)} de você!`,
      body: `Nova oferta de ${offer.partnerName} liberada para o CEP ${formatCep(cep)} com ${offer.discountValue}!`,
      offerId: offer.id,
      partnerName: offer.partnerName,
      partnerLogo: offer.partnerLogo,
      discountValue: offer.discountValue,
      distanceKm: offer.distanceKm || 0.8,
      userCep: cep,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'nearby_offer',
    };

    this.dispatchNotification(notif);
    return notif;
  }

  /**
   * Dispatches an alert when visitor arrives via referral link
   */
  public notifyReferral(refCode: string, offerTitle?: string) {
    const notif: AppNotification = {
      id: `ref_${Date.now()}`,
      title: '🎁 Indicação Especial Recebida!',
      body: offerTitle
        ? `Você acessou "${offerTitle}" via link de indicação (${refCode}). Resgate seu benefício grátis!`
        : `Você foi indicado através do código "${refCode}". Aproveite até 50% de economia no Clube VTXMais!`,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'system',
    };
    this.dispatchNotification(notif);
    return notif;
  }

  /**
   * Resets notified offers cache so the user can re-trigger scans
   */
  public resetNotifiedCache() {
    try {
      localStorage.removeItem(STORAGE_NOTIFIED_IDS_KEY);
    } catch {}
  }
}

export const notificationService = new NotificationService();
