import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Offer, OfferReview, UserSessionData, UserPointsWallet } from '../types';
import { api, sessionService, userCouponsService } from '../services/api';
import { pointsService } from '../services/pointsService';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  User,
  AlertCircle,
  Tag,
  Clock,
  Printer,
  Star,
  Send,
  Wallet,
  Coins,
} from 'lucide-react';
import { formatCep } from '../utils/geo';
import { ShareButtons } from './ShareButtons';

interface CouponModalProps {
  offer: Offer | null;
  userCep: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenVoucher: (offer: Offer, couponCode: string, leadName: string) => void;
  onReviewSubmitted?: (review: OfferReview, updatedOffer: Offer) => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  offer: rawOffer,
  userCep,
  isOpen,
  onClose,
  onOpenVoucher,
  onReviewSubmitted,
}) => {
  const [cachedOffer, setCachedOffer] = useState<Offer | null>(rawOffer);

  useEffect(() => {
    if (rawOffer) {
      setCachedOffer(rawOffer);
    }
  }, [rawOffer]);

  const offer = rawOffer || cachedOffer;

  const [sessionUser, setSessionUser] = useState<UserSessionData | null>(null);
  const [useStoredSession, setUseStoredSession] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'lookup' | 'points'>('register');

  // Points Wallet State
  const [wallet, setWallet] = useState<UserPointsWallet | null>(null);
  const [payingWithPoints, setPayingWithPoints] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const pointsCost = 50; // Custo padrão de resgate com pontos

  // Form Fields for new registration
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  // Field for lookup recognition (Email, Telefone, or CPF)
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Loading & Result States
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedCode, setUnlockedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Post-Redemption Star Rating state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<OfferReview | null>(null);

  // On open or offer change, check existing session
  useEffect(() => {
    if (isOpen && offer) {
      setIsUnlocked(false);
      setCopied(false);
      setErrors({});
      setLookupMessage(null);
      setRating(5);
      setHoverRating(0);
      setReviewComment('');
      setIsSubmittingReview(false);
      setReviewSubmitted(null);

      const stored = sessionService.getStoredUser();
      if (stored && stored.name && stored.email) {
        setSessionUser(stored);
        setName(stored.name);
        setPhone(stored.phone);
        setEmail(stored.email);
        setCpf(stored.cpf || '');
        setAgreedPrivacy(true);
        setUseStoredSession(true);
      } else {
        setSessionUser(null);
        setUseStoredSession(false);
        setActiveTab('register');
      }

      // Record offer view
      if (offer) {
        api.recordView(offer.id);
      }
      pointsService.getWallet().then(setWallet).catch(() => {});
    }
  }, [isOpen, offer]);

  // Handler para Pagamento com Pontos nos Parceiros da Plataforma
  const handlePayWithPoints = async () => {
    if (!offer) return;
    setPayingWithPoints(true);
    setPointsError(null);
    try {
      const activeUser = sessionUser || {
        name: name || 'Associado VTXMais',
        email: email || 'associado@vtxmais.com.br',
      };
      const res = await pointsService.payPartnerWithPoints({
        userId: (activeUser as any).id || wallet?.usuario_id,
        name: activeUser.name,
        email: activeUser.email,
        partnerId: offer.partnerId,
        partnerName: offer.partnerName,
        offerId: offer.id,
        offerTitle: offer.title,
        discountValue: offer.discountValue,
        pontosValor: pointsCost,
      });

      setUnlockedCode(res.voucherCode);
      setIsUnlocked(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      userCouponsService.addRedeemedCoupon(activeUser.email || 'associado', {
        offerId: offer.id,
        offerTitle: offer.title,
        partnerName: offer.partnerName,
        partnerLogo: offer.partnerLogo,
        category: offer.category,
        couponCode: res.voucherCode,
        discountValue: offer.discountValue,
      });

      if (res.wallet) {
        setWallet(res.wallet);
      }
    } catch (err: any) {
      setPointsError(err.message || 'Falha ao processar pagamento com pontos.');
    } finally {
      setPayingWithPoints(false);
    }
  };

  // Phone input mask: (99) 99999-9999 or (99) 9999-9999
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setPhone(formatted);
  };

  // CPF input mask: 000.000.000-00
  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    }
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    }
    setCpf(formatted);
  };

  // Quick Recognition by Email, Phone, or CPF
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupMessage(null);
    setErrors({});

    if (!lookupQuery.trim()) {
      setErrors({ lookup: 'Informe seu E-mail, Telefone ou CPF cadastrado.' });
      return;
    }

    try {
      setLookupLoading(true);
      const res = await api.lookupCustomer(lookupQuery.trim());
      const customer = res.customer;

      // Found customer! Save session & unlock coupon
      const sessionData: UserSessionData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpf: customer.cpf,
        userCep: customer.userCep || userCep,
        savedAt: new Date().toISOString(),
      };
      sessionService.saveUser(sessionData);
      setSessionUser(sessionData);
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      if (customer.cpf) setCpf(customer.cpf);
      setUseStoredSession(true);

      // Now claim the coupon immediately
      await claimCouponFlow(customer.name, customer.email, customer.phone, customer.cpf);
    } catch (err: any) {
      setLookupMessage(
        err.message || 'Cadastro não localizado. Faça seu cadastro rápido na aba ao lado.'
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Por favor, digite seu nome completo.';
    } else if (name.trim().split(' ').length < 2) {
      newErrors.name = 'Por favor, informe nome e sobrenome.';
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Informe seu telefone ou WhatsApp.';
    } else if (rawPhone.length < 10) {
      newErrors.phone = 'Telefone inválido com DDD (mínimo 10 dígitos).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Informe seu endereço de e-mail.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Formato de e-mail inválido. Ex: nome@email.com';
    }

    if (!agreedPrivacy) {
      newErrors.privacy = 'Você precisa aceitar a Política de Privacidade para liberar o cupom.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const claimCouponFlow = async (custName: string, custEmail: string, custPhone: string, custCpf?: string) => {
    if (!offer) return;
    setIsLoading(true);
    setErrors({});

    try {
      // 1. Register in internal customer DB & CRM
      await api.registerCustomer({
        name: custName,
        email: custEmail,
        phone: custPhone,
        cpf: custCpf,
        userCep: userCep || sessionService.getSavedCep() || offer.cep,
        offerId: offer.id,
      });

      // 2. Claim coupon in leads API
      const response = await api.claimCoupon({
        name: custName,
        phone: custPhone,
        email: custEmail,
        offerId: offer.id,
        userCep: userCep || sessionService.getSavedCep() || offer.cep,
      });

      setUnlockedCode(response.couponCode || offer.couponCode);
      setIsUnlocked(true);

      // 3. Save to user redeemed coupons portfolio
      userCouponsService.addRedeemedCoupon(custEmail, {
        offerId: offer.id,
        offerTitle: offer.title,
        partnerName: offer.partnerName,
        partnerLogo: offer.partnerLogo,
        category: offer.category,
        couponCode: response.couponCode || offer.couponCode,
        discountValue: offer.discountValue,
      });

      // Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch {}
    } catch (err: any) {
      setErrors({ form: err?.message || 'Falha ao processar resgate. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!useStoredSession && !validate()) {
      return;
    }

    const targetName = useStoredSession && sessionUser ? sessionUser.name : name.trim();
    const targetEmail = useStoredSession && sessionUser ? sessionUser.email : email.trim();
    const targetPhone = useStoredSession && sessionUser ? sessionUser.phone : phone.trim();
    const targetCpf = useStoredSession && sessionUser ? sessionUser.cpf : cpf.trim();

    await claimCouponFlow(targetName, targetEmail, targetPhone, targetCpf);
  };

  const handleCopyCode = () => {
    if (!unlockedCode) return;
    navigator.clipboard.writeText(unlockedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    try {
      setIsSubmittingReview(true);
      const res = await api.submitReview({
        offerId: offer.id,
        rating,
        comment: reviewComment.trim(),
        userName: name || sessionUser?.name || 'Associado VTXMais',
        userEmail: email || sessionUser?.email,
        couponCode: unlockedCode,
        verifiedRedemption: true,
      });
      setReviewSubmitted(res.review);
      if (onReviewSubmitted) {
        onReviewSubmitted(res.review, res.offer);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && offer && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

        {/* Modal Top Header with Offer Overview */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <div className="flex items-start gap-3.5 pr-8">
            <img
              src={offer.partnerLogo}
              alt={offer.partnerName}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20 bg-white shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-300">
                  {offer.partnerName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {offer.discountValue}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug font-heading">
                {offer.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!isUnlocked ? (
            /* ================= FORM VIEW ================= */
            <div className="space-y-4">
              {/* Session Shortcut if returning user */}
              {sessionUser && useStoredSession ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        Cliente Reconhecido no Clube
                      </h4>
                      <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                        Bem-vindo(a) de volta, <strong className="text-slate-900">{sessionUser.name}</strong> ({sessionUser.email}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={isLoading || payingWithPoints}
                      className="flex-1 py-3 px-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Liberando Cupom...</span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Baixar Cupom Grátis</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handlePayWithPoints}
                      disabled={isLoading || payingWithPoints}
                      className="py-3 px-3.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      title={`Pagar com ${pointsCost} pontos da sua carteira`}
                    >
                      <Wallet className="w-4 h-4 text-emerald-200" />
                      <span>{payingWithPoints ? 'Processando...' : `Pagar (${pointsCost} pts)`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sessionService.clearUser();
                        setSessionUser(null);
                        setUseStoredSession(false);
                      }}
                      className="text-xs text-slate-500 hover:text-rose-600 underline px-1 cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                /* Tabs: Novo Cadastro vs Já Tenho Cadastro vs Pagar com Pontos */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeTab === 'register'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cadastro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('lookup')}
                      className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeTab === 'lookup'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Já Membro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('points')}
                      className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeTab === 'points'
                          ? 'bg-white text-blue-600 shadow-xs font-black'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Usar Pontos</span>
                    </button>
                  </div>

                  {activeTab === 'points' ? (
                    /* TAB: PAGAR COM PONTOS */
                    <div className="space-y-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-200 animate-fadeIn">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-blue-600" />
                            <span>Pagamento com Pontos do Clube</span>
                          </div>
                          <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                            Pague este benefício diretamente com seu saldo de pontos na Conta Mãe.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-xs">
                          {pointsCost} pts
                        </span>
                      </div>

                      {/* Saldo do usuário */}
                      <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Seu Saldo Disponível:</span>
                        <span className="font-black text-slate-900 text-sm">
                          {wallet
                            ? `${wallet.saldo_disponivel_pontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pts`
                            : 'Consultando carteira...'}
                        </span>
                      </div>

                      {pointsError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{pointsError}</span>
                        </div>
                      )}

                      {wallet && wallet.saldo_disponivel_pontos < pointsCost ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                          <p>
                            Saldo insuficiente para esta compra. Seu saldo atual é de{' '}
                            <strong>{wallet.saldo_disponivel_pontos} pts</strong>.
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Adquira pontos instantaneamente via PIX pelo menu "Pontos" no topo.
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePayWithPoints}
                          disabled={payingWithPoints}
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          {payingWithPoints ? (
                            <span>Processando Débito no Ledger...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>Confirmar Pagamento com Pontos ({pointsCost} pts)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : activeTab === 'lookup' ? (
                    /* TAB: RECONHECIMENTO RÁPIDO (E-MAIL, TELEFONE OU CPF) */
                    <form onSubmit={handleLookupSubmit} className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Reconhecimento Imediato de Cliente
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Informe seu E-mail, Telefone/WhatsApp ou CPF cadastrado para desbloquear o cupom instantaneamente:
                        </p>
                      </div>

                      {lookupMessage && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                          <span>{lookupMessage}</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('register')}
                            className="text-blue-600 font-bold underline shrink-0 cursor-pointer"
                          >
                            Cadastrar agora
                          </button>
                        </div>
                      )}

                      {errors.lookup && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          {errors.lookup}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          E-mail, Telefone ou CPF *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={lookupQuery}
                            onChange={(e) => {
                              setLookupQuery(e.target.value);
                              if (errors.lookup) setErrors({ ...errors, lookup: '' });
                            }}
                            placeholder="mariana.ramos@gmail.com, (11) 98765-4321 ou CPF"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={lookupLoading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {lookupLoading ? (
                          <span>Localizando cadastro...</span>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Identificar e Baixar Cupom</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* TAB: NOVO CADASTRO */
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      <div className="text-xs text-slate-500 font-medium">
                        Preencha os dados abaixo uma única vez para liberar cupons e permanecer logado(a):
                      </div>

                      {errors.form && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errors.form}</span>
                        </div>
                      )}

                      {/* Nome Completo */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nome Completo <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            placeholder="Ex: Ana Maria Silva"
                            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                              errors.name
                                ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                                : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 pl-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Row: Telefone & CPF */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Telefone / WhatsApp <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                handlePhoneChange(e.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                              }}
                              placeholder="(11) 98765-4321"
                              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                                errors.phone
                                  ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-[11px] text-rose-500 font-medium mt-1 pl-1">
                              {errors.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            CPF (Para Reconhecimento Futuro)
                          </label>
                          <input
                            type="text"
                            value={cpf}
                            onChange={(e) => handleCpfChange(e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* E-mail */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          E-mail Pessoal <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            placeholder="seuemail@exemplo.com"
                            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                              errors.email
                                ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                                : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 pl-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Privacy Policy Checkbox */}
                      <div className="pt-1">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agreedPrivacy}
                            onChange={(e) => {
                              setAgreedPrivacy(e.target.checked);
                              if (errors.privacy) setErrors({ ...errors, privacy: '' });
                            }}
                            className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-600 leading-tight">
                            Li e concordo com a <strong className="text-slate-800">Política de Privacidade</strong> e autorizo o envio do código promocional e ofertas parceiras.
                          </span>
                        </label>
                        {errors.privacy && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 pl-1">
                            {errors.privacy}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Registrando no CRM e Liberando Cupom...
                          </span>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Cadastrar e Baixar Cupom</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Security Trust Marker */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dados protegidos via SSL e integração direta com CRM VTXMais</span>
              </div>
            </div>
          ) : (
            /* ================= UNLOCKED SUCCESS VIEW ================= */
            <div className="space-y-5 text-center animate-fadeIn">
              {/* Success Banner */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Obrigado! Seu cupom foi liberado com sucesso.
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apresente este código no estabelecimento ou aplique no site parceiro.
                </p>
              </div>

              {/* Highlighted Coupon Box */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-2 border-dashed border-blue-400 shadow-xl overflow-hidden">
                <div className="text-[11px] text-blue-300 uppercase tracking-widest font-semibold">
                  CÓDIGO EXCLUSIVO
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300 my-2 select-all">
                  {unlockedCode}
                </div>
                <div className="text-[11px] text-slate-300 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Válido até {new Date(offer.validUntil).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Action Buttons: 📋 Copiar Código | ⬇️ Baixar Cupom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer border ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Código Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenVoucher(offer, unlockedCode, name)}
                  className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Baixar Cupom</span>
                </button>
              </div>

              {/* Compartilhamento Rápido com Amigos */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/70 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Compartilhe este benefício com amigos
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Link com cupom direto
                  </span>
                </div>
                <ShareButtons
                  offerId={offer.id}
                  offerTitle={offer.title}
                  partnerName={offer.partnerName}
                  discountValue={offer.discountValue}
                  referralCode={unlockedCode || 'cupom_amigo'}
                  variant="modal"
                />
              </div>

              {/* Avaliação Pós-Resgate (Classificação por Estrelas) */}
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white p-4 rounded-2xl border border-amber-200 text-left space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-700">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-heading">
                      Avalie esta Oferta pós-resgate
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Classifique as vantagens do parceiro {offer.partnerName}
                    </p>
                  </div>
                </div>

                {reviewSubmitted ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Avaliação registrada com sucesso!</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < reviewSubmitted.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1">({reviewSubmitted.rating}/5 estrelas)</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
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
                                className={`w-5 h-5 transition-colors ${
                                  active
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {rating === 5 ? 'Excelente ⭐ 5' : rating === 4 ? 'Muito bom ⭐ 4' : rating === 3 ? 'Regular ⭐ 3' : rating === 2 ? 'Abaixo do esperado ⭐ 2' : 'Péssimo ⭐ 1'}
                      </span>
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Deixe um comentário sobre o desconto ou atendimento (opcional)..."
                      maxLength={250}
                      rows={2}
                      className="w-full p-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 resize-none font-medium"
                    />

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Computado na nota pública da oferta
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingReview ? 'Enviando...' : 'Salvar Avaliação'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Partner Address & Web link */}
              <div className="bg-slate-50 rounded-2xl p-3.5 text-left border border-slate-200 text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>{offer.partnerName}</span>
                  <a
                    href={offer.address}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Como chegar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{offer.address} - {offer.city}/{offer.state}</span>
                </div>
                {offer.terms && (
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 leading-tight">
                    <strong>Regras:</strong> {offer.terms}
                  </div>
                )}
              </div>

              {/* Close / Return button */}
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
              >
                Voltar e ver mais ofertas
              </button>
            </div>
          )}
        </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
