import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Offer } from '../types';
import {
  MapPin,
  Flame,
  Calendar,
  Tag,
  ArrowRight,
  Sparkles,
  Share2,
  Check,
  Heart,
  Copy,
  X,
  Smartphone,
  ExternalLink,
  Star,
  Coins,
} from 'lucide-react';
import { formatDistance } from '../utils/geo';
import { ShareButtons, buildShareUrl } from './ShareButtons';

interface OfferCardProps {
  offer: Offer;
  onClaim: (offer: Offer) => void;
  userCep?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (offerId: string) => void;
  index?: number;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onClaim,
  userCep,
  isFavorite = false,
  onToggleFavorite,
  index = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isClose = offer.distanceKm !== undefined && offer.distanceKm <= 5.0;

  // Generates unique URL pointing directly to this offer with referral parameter
  const getShareUrl = () => {
    return buildShareUrl(offer.id, `amigo_${offer.id.slice(0, 8)}`, 'card');
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(offer.id);
    }
  };

  // 1. Copy unique link directly to clipboard
  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareUrl();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 2. Share via WhatsApp
  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();
    const message = `🔥 *${offer.discountValue} no ${offer.partnerName}*!\n\n` +
      `Aproveite esta oferta exclusiva do Clube VTXMais:\n` +
      `"${offer.title}"\n\n` +
      `👉 Resgate seu cupom grátis no link:\n${shareUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Web Share API (native OS share dialog)
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${offer.discountValue} - ${offer.partnerName} | Clube VTXMais`,
          text: `Economize no ${offer.partnerName} com o Clube VTXMais: "${offer.title}" (${offer.discountValue})! Resgate seu cupom grátis:`,
          url: shareUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        setIsShareOpen(false);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback if Web Share is not supported
    handleCopyLink();
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <motion.div
      id={`offer-${offer.id}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.05, 0.35),
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-2xs relative"
    >
      {/* Interactive In-Card Share Overlay */}
      {isShareOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-5 flex flex-col justify-between text-white animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-heading text-white">
                  Compartilhar Oferta
                </h4>
                <p className="text-[10px] text-slate-400">
                  Link único com cupom direto
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsShareOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Offer preview in overlay */}
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <img
              src={offer.partnerLogo}
              alt={offer.partnerName}
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {offer.partnerName}
              </div>
              <div className="text-[11px] text-emerald-400 font-extrabold truncate">
                {offer.discountValue} • {offer.title}
              </div>
            </div>
          </div>

          {/* Unique Link & Social Share Buttons */}
          <div className="py-1">
            <ShareButtons
              offerId={offer.id}
              offerTitle={offer.title}
              partnerName={offer.partnerName}
              discountValue={offer.discountValue}
              referralCode={`amigo_${offer.id.slice(0, 8)}`}
              variant="card"
            />
          </div>
        </div>
      )}

      <div>
        {/* Card Header & Image */}
        <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
          <img
            src={offer.image}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Discount Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {offer.discountValue}
            </span>
          </div>

          {/* Top Right Badges: Featured, Favorite & Quick Share */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {offer.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 text-amber-950 shadow-sm uppercase tracking-wider">
                Destaque
              </span>
            )}

            {/* Heart Favorite Button */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer shadow-md ${
                isFavorite
                  ? 'bg-rose-500 text-white scale-105'
                  : 'bg-black/50 hover:bg-black/70 text-white hover:text-rose-300'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-white text-white' : 'text-white'
                }`}
              />
            </button>

            {/* Quick Share Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareOpen(true);
              }}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black/50 hover:bg-black/70 text-white'
              }`}
              title="Compartilhar oferta via WhatsApp, redes sociais ou copiar link único"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Partner Floating Badge */}
          <div className="absolute -bottom-4 left-4 flex items-center gap-2.5">
            <img
              src={offer.partnerLogo}
              alt={offer.partnerName}
              className="w-10 h-10 rounded-xl object-cover border-2 border-white bg-white shadow-md"
            />
            <div className="bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide">
              {offer.partnerName}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 pt-7 space-y-3">
          {/* Metadata Row: Category and Rating */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-500 font-medium text-xs flex items-center gap-1 truncate">
                <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {offer.category}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold shrink-0">
                <Coins className="w-3 h-3 text-blue-600" />
                Aceita Pontos
              </span>
            </div>

            {/* Average Star Rating Badge */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0 font-medium text-xs shadow-2xs"
              title={`Classificação pós-resgate: ${(offer.rating || 5).toFixed(1)} estrelas (${offer.ratingCount || 1} avaliações)`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-900">{(offer.rating || 5).toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 font-normal">({offer.ratingCount || 1})</span>
            </div>
          </div>

          {/* Distance badge if CEP is provided */}
          {offer.distanceKm !== undefined && (
            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                  isClose
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
                title={`Calculado com base no seu CEP (${userCep || ''})`}
              >
                <MapPin className="w-3 h-3" />
                {formatDistance(offer.distanceKm)} de você
              </span>
            </div>
          )}

          {/* Offer Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {offer.title}
          </h3>

          {/* Offer Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {offer.description}
          </p>

          {/* Address & City */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{offer.address} - {offer.city}/{offer.state}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 pt-3.5 border-t border-slate-100 space-y-3 bg-slate-50/60">
        {/* Row 1: Saves Count and Auxiliary Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
            </div>
            <span><strong className="text-slate-800">{offer.savesCount.toLocaleString('pt-BR')}</strong> resgatados</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Heart Button in Footer */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                  : 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>

            {/* Share Button with Live Feedback */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareOpen(true);
              }}
              className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                  : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600'
              }`}
              title="Compartilhar oferta via WhatsApp, redes sociais ou copiar link único"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-semibold hidden xs:inline">Compartilhar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Centered full-width button on the bottom line */}
        <div className="pt-0.5 flex items-center justify-center w-full">
          <button
            onClick={() => onClaim(offer)}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group/btn"
          >
            <Tag className="w-4 h-4 text-blue-200" />
            <span>Resgatar Oferta / Ver Cupom</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
