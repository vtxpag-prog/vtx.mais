import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

// Social Media Brand SVG Icons
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/>
  </svg>
);

export const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export function buildShareUrl(offerId: string, refCode: string = 'amigo', source: string = 'share'): string {
  try {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = new URL(origin + path);
    url.searchParams.set('offer', offerId);
    url.searchParams.set('ref', refCode);
    url.searchParams.set('utm_source', source);
    return url.toString();
  } catch {
    return `${window.location.origin}/?offer=${encodeURIComponent(offerId)}&ref=${encodeURIComponent(refCode)}&utm_source=${source}`;
  }
}

interface ShareButtonsProps {
  offerId: string;
  offerTitle: string;
  partnerName: string;
  discountValue: string;
  referralCode?: string;
  variant?: 'card' | 'modal' | 'banner';
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  offerId,
  offerTitle,
  partnerName,
  discountValue,
  referralCode = 'convite_amigo',
  variant = 'modal',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = buildShareUrl(offerId, referralCode, variant);

  const shareMessage = `🔥 *${discountValue} no ${partnerName}*!\n\n` +
    `Aproveite este benefício exclusivo do Clube VTXMais:\n` +
    `"${offerTitle}"\n\n` +
    `👉 Resgate seu cupom grátis no link de indicação:\n${shareUrl}`;

  const handleCopyLink = async () => {
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const text = `🔥 Desconto exclusivo no ${partnerName}: "${offerTitle}" (${discountValue}) pelo Clube VTXMais!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const text = `Aproveite este super benefício do ${partnerName}: "${offerTitle}" (${discountValue}) pelo Clube VTXMais!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${discountValue} - ${partnerName} | Clube VTXMais`,
          text: `Economize no ${partnerName} com o Clube VTXMais: "${offerTitle}" (${discountValue})!`,
          url: shareUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    handleCopyLink();
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Referral Link & Copy Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1 text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Link com Parâmetro de Indicação:</span>
          </span>
          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-mono border border-amber-200">
            ref={referralCode}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
          <span className="text-[11px] text-slate-600 truncate font-mono flex-1 select-all">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
            title="Copiar link com código de indicação"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Network Share Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          title="Compartilhar via WhatsApp"
        >
          <WhatsAppIcon className="w-4 h-4 text-white" />
          <span>WhatsApp</span>
        </button>

        {/* Telegram */}
        <button
          type="button"
          onClick={handleTelegram}
          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#0088cc] hover:bg-[#0077b5] text-white flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          title="Compartilhar via Telegram"
        >
          <TelegramIcon className="w-4 h-4 text-white" />
          <span>Telegram</span>
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={handleTwitter}
          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          title="Compartilhar no X (antigo Twitter)"
        >
          <XTwitterIcon className="w-3.5 h-3.5 text-white" />
          <span>X / Twitter</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebook}
          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          title="Compartilhar no Facebook"
        >
          <FacebookIcon className="w-4 h-4 text-white" />
          <span>Facebook</span>
        </button>
      </div>

      {/* Auxiliary actions row: LinkedIn & Native Share */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleLinkedIn}
          className="flex-1 py-2 px-3 rounded-xl font-semibold text-xs bg-[#0A66C2] hover:bg-[#095196] text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
          title="Compartilhar no LinkedIn"
        >
          <LinkedInIcon className="w-3.5 h-3.5 text-white" />
          <span>LinkedIn</span>
        </button>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex-1 py-2 px-3 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Abrir menu de compartilhamento do seu dispositivo"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Mais Opções</span>
          </button>
        )}
      </div>
    </div>
  );
};
