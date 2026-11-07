import React, { useEffect, useState } from 'react';
import { AppNotification } from '../services/notificationService';
import { Bell, MapPin, X, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { formatDistance } from '../utils/geo';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onOpenOffer: (offerId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onOpenOffer,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 7000; // 7 seconds
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] animate-bounce-short shadow-2xl">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl border border-slate-700/80 p-4 overflow-hidden relative shadow-2xl">
        {/* Top Progress Bar */}
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-3">
          {/* Partner Logo or Bell Icon */}
          <div className="relative shrink-0">
            {notification.partnerLogo ? (
              <img
                src={notification.partnerLogo}
                alt={notification.partnerName || 'Parceiro'}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-700 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
            )}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Nova Oferta na Região
              </span>

              {notification.distanceKm !== undefined && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {formatDistance(notification.distanceKm)} de você
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white mt-1 leading-snug font-heading">
              {notification.title}
            </h4>

            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {notification.body}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
              {notification.offerId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenOffer(notification.offerId!);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-white" />
                  <span>Ver Oferta & Cupom</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition cursor-pointer hover:bg-slate-800"
              >
                Dispensar
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
