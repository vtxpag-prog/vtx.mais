import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MapPin,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Tag,
  Zap,
  ShieldCheck,
  X,
  Compass,
} from 'lucide-react';
import {
  notificationService,
  AppNotification,
  NotificationPreferences,
} from '../services/notificationService';
import { Offer } from '../types';
import { formatCep, formatDistance } from '../utils/geo';

interface NotificationCenterProps {
  userCep: string;
  onOpenCepModal: () => void;
  onOpenOffer: (offerId: string) => void;
  offers?: Offer[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userCep,
  onOpenCepModal,
  onOpenOffer,
  offers = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    notificationService.getHistory()
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    notificationService.getPreferences()
  );
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    () => notificationService.getBrowserPermission()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimatingBell, setIsAnimatingBell] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync notifications from service & subscribe to new ones
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotif) => {
      setNotifications(notificationService.getHistory());
      // Animate bell on new notification
      setIsAnimatingBell(true);
      setTimeout(() => setIsAnimatingBell(false), 1200);
    });

    return () => unsubscribe();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    setNotifications(notificationService.getHistory());
    setBrowserPermission(notificationService.getBrowserPermission());
  };

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestBrowserPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      notificationService.triggerTestNotification(offers[0], userCep);
    }
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getHistory());
  };

  const handleClearHistory = () => {
    notificationService.clearHistory();
    setNotifications([]);
  };

  const handleSavePref = (newPrefs: Partial<NotificationPreferences>) => {
    const updated = notificationService.savePreferences(newPrefs);
    setPreferences(updated);
  };

  const handleTestNotification = () => {
    const testOffer = offers.find((o) => (o.distanceKm || 0) <= preferences.maxDistanceKm) || offers[0];
    notificationService.triggerTestNotification(testOffer, userCep);
    setNotifications(notificationService.getHistory());
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return `Há ${Math.floor(diff / 86400)} dias`;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-inner'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs'
        } ${isAnimatingBell ? 'animate-bounce' : ''}`}
        title="Notificações de novas ofertas na sua região"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                  <span>Alertas Regionais</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                      {unreadCount} nova{unreadCount === 1 ? '' : 's'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Novas ofertas de parceiros perto de você
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showSettings ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Configurações de alerta"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Regional Context Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {userCep ? (
                <span className="truncate">
                  CEP: <strong className="text-slate-800">{formatCep(userCep)}</strong> (Raio:{' '}
                  {preferences.maxDistanceKm} km)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCepModal}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Definir CEP para alertas regionais
                </button>
              )}
            </div>

            {userCep && (
              <button
                type="button"
                onClick={onOpenCepModal}
                className="text-[10px] text-blue-600 hover:underline font-bold shrink-0 ml-1"
              >
                Alterar
              </button>
            )}
          </div>

          {/* Browser / Service Worker Permission Banner */}
          {browserPermission !== 'granted' && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="font-bold text-blue-900 leading-tight">
                    Notificações do Navegador
                  </div>
                  <div className="text-[11px] text-blue-700/80 leading-snug">
                    Receba avisos instantâneos via Service Worker
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shrink-0 transition shadow-2xs cursor-pointer"
              >
                Ativar
              </button>
            </div>
          )}

          {browserPermission === 'granted' && (
            <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Service Worker & Notificações Ativas
              </span>
              <span className="text-[10px] text-emerald-600">Em tempo real</span>
            </div>
          )}

          {/* Settings Drawer (expandable) */}
          {showSettings && (
            <div className="p-3.5 bg-slate-100/90 border-b border-slate-200 space-y-3 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Preferências de Notificação</span>
                <button
                  type="button"
                  onClick={() => handleSavePref({ soundEnabled: !preferences.soundEnabled })}
                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  {preferences.soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      Som Ativo
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      Mudo
                    </>
                  )}
                </button>
              </div>

              {/* Distance Radius Buttons */}
              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">
                  Raio máximo de proximidade das ofertas:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 25].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => handleSavePref({ maxDistanceKm: km })}
                      className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        preferences.maxDistanceKm === km
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Button & Clear Cache */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Testar Alerta Próximo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    notificationService.resetNotifiedCache();
                    handleTestNotification();
                  }}
                  className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                  title="Limpar cache de alertas já disparados e verificar novamente"
                >
                  Reescanear
                </button>
              </div>
            </div>
          )}

          {/* Quick Action Toolbar */}
          <div className="p-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200 transition cursor-pointer"
              title="Disparar uma notificação instantânea para testar o sistema"
            >
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Simular Nova Oferta</span>
            </button>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="hover:text-blue-600 transition flex items-center gap-0.5 cursor-pointer text-[11px]"
                  title="Marcar todas as notificações como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Ler todas</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="hover:text-rose-600 transition flex items-center gap-0.5 cursor-pointer text-[11px]"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Nenhum alerta recente
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Assim que novos parceiros lançarem ofertas dentro de {preferences.maxDistanceKm} km do seu CEP salvo, você receberá um alerta sonoro e notificação aqui!
                </p>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Enviar Alerta de Demonstração
                </button>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    notificationService.markAsRead(item.id);
                    setNotifications(notificationService.getHistory());
                    if (item.offerId) {
                      onOpenOffer(item.offerId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 hover:bg-slate-50/90 transition cursor-pointer flex items-start gap-3 relative group ${
                    !item.read ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!item.read && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}

                  {/* Partner Image or Icon */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 mt-0.5 shadow-2xs">
                    {item.partnerLogo ? (
                      <img
                        src={item.partnerLogo}
                        alt={item.partnerName || 'Parceiro'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-600 bg-blue-50">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                      {item.body}
                    </p>

                    {/* Bottom Badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {item.distanceKm !== undefined && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <MapPin className="w-2.5 h-2.5" />
                          {formatDistance(item.distanceKm)}
                        </span>
                      )}

                      {item.discountValue && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          <Tag className="w-2.5 h-2.5" />
                          {item.discountValue}
                        </span>
                      )}

                      {item.offerId && (
                        <span className="text-[10px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5 ml-auto">
                          Resgatar Cupom
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer info */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
            Alertas geolocalizados via Service Worker & Web Notifications
          </div>
        </div>
      )}
    </div>
  );
};
