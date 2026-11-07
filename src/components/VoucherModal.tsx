import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Offer, OfferReview } from '../types';
import {
  X,
  Printer,
  Download,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Calendar,
  QrCode,
  Star,
  MessageSquare,
  Send,
  Share2,
} from 'lucide-react';
import { printVoucher } from '../utils/voucherGenerator';
import { api } from '../services/api';
import { ShareButtons } from './ShareButtons';

interface VoucherModalProps {
  isOpen: boolean;
  offer: Offer | null;
  couponCode: string;
  leadName: string;
  onClose: () => void;
  onReviewSubmitted?: (review: OfferReview, updatedOffer: Offer) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  offer,
  couponCode,
  leadName,
  onClose,
  onReviewSubmitted,
}) => {
  const [cachedOffer, setCachedOffer] = useState<Offer | null>(offer);

  useEffect(() => {
    if (offer) {
      setCachedOffer(offer);
    }
  }, [offer]);

  const activeOffer = offer || cachedOffer;

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedReview, setSubmittedReview] = useState<OfferReview | null>(null);

  const voucherId = activeOffer ? `voucher-${activeOffer.id}` : 'voucher-default';

  const handlePrint = () => {
    printVoucher(voucherId);
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Excelente! ⭐⭐⭐⭐⭐';
      case 4:
        return 'Muito bom! ⭐⭐⭐⭐';
      case 3:
        return 'Regular / Médio ⭐⭐⭐';
      case 2:
        return 'Abaixo do esperado ⭐⭐';
      case 1:
        return 'Péssimo ⭐';
      default:
        return 'Selecione uma nota de 1 a 5 estrelas';
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffer) return;
    try {
      setSubmitting(true);
      const res = await api.submitReview({
        offerId: activeOffer.id,
        rating,
        comment: comment.trim(),
        userName: leadName || 'Associado VTXMais',
        couponCode,
        verifiedRedemption: true,
      });

      setSubmittedReview(res.review);
      if (onReviewSubmitted) {
        onReviewSubmitted(res.review, res.offer);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
          >
        
        {/* Top actions */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Voucher Digital VTXMais
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Voucher Card */}
        <div className="p-6 bg-slate-100/50">
          <div
            id={voucherId}
            className="bg-white rounded-2xl border-2 border-dashed border-blue-500 p-6 shadow-md relative overflow-hidden"
          >
            {/* Top header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeOffer.partnerLogo}
                  alt={activeOffer.partnerName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeOffer.partnerName}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {activeOffer.title}
                  </h3>
                </div>
              </div>
              <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0">
                {activeOffer.discountValue}
              </div>
            </div>

            {/* Code Box */}
            <div className="my-5 p-4 rounded-xl bg-slate-900 text-center text-white border-2 border-amber-400">
              <div className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">
                CÓDIGO DE RESGATE
              </div>
              <div className="text-3xl font-black font-mono tracking-widest text-amber-300 my-1 select-all">
                {couponCode}
              </div>
              <div className="text-[11px] text-slate-300">
                Apresente este código no caixa ou insira no checkout online
              </div>
            </div>

            {/* Beneficiary & Validity */}
            <div className="grid grid-cols-2 gap-4 text-xs py-3 border-t border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">Titular do Benefício:</span>
                <strong className="text-slate-900">{leadName || 'Usuário Clube VTXMais'}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Validade:</span>
                <strong className="text-slate-900">
                  {new Date(activeOffer.validUntil).toLocaleDateString('pt-BR')}
                </strong>
              </div>
            </div>

            {/* Address & QR Code simulation */}
            <div className="mt-4 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{activeOffer.address} - {activeOffer.city}/{activeOffer.state}</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Regras: {activeOffer.terms}
                </div>
              </div>

              {/* QR Code Graphic representation */}
              <div className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-slate-800" />
                <span className="text-[7px] text-slate-500 uppercase tracking-tighter">VTX-PASS</span>
              </div>
            </div>

            {/* Barcode visual footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex flex-col items-center justify-center">
              <div className="h-6 w-56 flex items-center justify-between gap-0.5 opacity-80">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full bg-slate-900 ${
                      i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">
                VTX-VERIFIED-VOUCHER-{activeOffer.id.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Compartilhe este Benefício com Amigos (WhatsApp & Redes Sociais) */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white border-t border-blue-200/60 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-700">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                Compartilhe este benefício com amigos
              </h4>
              <p className="text-[11px] text-slate-500">
                Envie o link de indicação para seus contatos resgatarem este mesmo desconto no VTXMais
              </p>
            </div>
          </div>

          <ShareButtons
            offerId={activeOffer.id}
            offerTitle={activeOffer.title}
            partnerName={activeOffer.partnerName}
            discountValue={activeOffer.discountValue}
            referralCode={couponCode || 'convite_amigo'}
            variant="modal"
          />
        </div>

        {/* Sistema de Avaliação Pós-Resgate (Estrelas & Feedback) */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white border-t border-amber-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-700">
              <Star className="w-4 h-4 fill-amber-400" />
            </span>
            <h4 className="text-sm font-bold text-slate-900 font-heading">
              Avalie esta Oferta pós-resgate
            </h4>
          </div>

          {submittedReview ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Obrigado pela sua avaliação! Sua nota foi registrada com sucesso.</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold pt-1">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < submittedReview.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span>({submittedReview.rating}/5 estrelas)</span>
              </div>
              {submittedReview.comment && (
                <p className="text-xs text-slate-700 italic bg-white/70 p-2 rounded-xl border border-emerald-100 mt-1">
                  "{submittedReview.comment}"
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} className="space-y-3">
              <p className="text-xs text-slate-600">
                Como você classifica as condições e vantagens desta oferta do parceiro <strong>{activeOffer.partnerName}</strong>?
              </p>

              {/* Seletor de 5 Estrelas Interativo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div
                  className="flex items-center gap-1 cursor-pointer select-none"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 text-slate-300 hover:scale-115 transition-transform cursor-pointer focus:outline-hidden"
                        title={`${star} estrelas`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>

              {/* Comentário Opcional */}
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Deixe um comentário sobre o atendimento ou desconto recebido (opcional)..."
                  maxLength={300}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Sua avaliação será computada na nota pública da oferta.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Salvando...' : 'Enviar Avaliação'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
