import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  Clock,
  Send,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Tag,
  Info,
  DollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserPointsWallet,
  PointsRequest,
  PointsPrepaidCard,
  PointsLedgerEntry,
  Offer,
  AdminUser,
} from '../types';
import { pointsService } from '../services/pointsService';
import { notificationService } from '../services/notificationService';

interface PointsWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser | null;
  onSelectOfferToPay?: (offer: Offer) => void;
}

export const PointsWalletModal: React.FC<PointsWalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectOfferToPay,
}) => {
  const [wallet, setWallet] = useState<UserPointsWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'buy_pix' | 'withdraw_pix' | 'card' | 'statement'>('overview');

  // Compra PIX State
  const [pixAmount, setPixAmount] = useState<number>(100);
  const [customPixAmount, setCustomPixAmount] = useState<string>('100');
  const [activePixRequest, setActivePixRequest] = useState<PointsRequest | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [simulatingPixPayment, setSimulatingPixPayment] = useState(false);

  // Saque PIX State
  const [withdrawPoints, setWithdrawPoints] = useState<string>('150');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [pixKeyValue, setPixKeyValue] = useState<string>('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Cartão Pré-Pago State
  const [cardType, setCardType] = useState<'virtual' | 'fisico'>('virtual');
  const [cardLoadAmount, setCardLoadAmount] = useState<string>('100');
  const [showCvv, setShowCvv] = useState(false);
  const [issuingCard, setIssuingCard] = useState(false);
  const [cardSuccessMsg, setCardSuccessMsg] = useState<string | null>(null);

  // Endereço para cartão físico
  const [cardAddress, setCardAddress] = useState({
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Apto 42',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-100',
  });

  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWallet();
      setFeedbackError(null);
      setWithdrawSuccessMsg(null);
      setCardSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await pointsService.getWallet({
        id: currentUser?.id || 'usr_admin_01',
        name: currentUser?.name || 'Associado VTXMais',
        email: currentUser?.email || 'associado@vtxmais.com.br',
        cpf: currentUser?.cpf || '',
      });
      setWallet(data);
      if (currentUser?.cpf && !pixKeyValue) {
        setPixKeyValue(currentUser.cpf);
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Erro ao carregar carteira.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePix = async () => {
    try {
      setFeedbackError(null);
      const val = Number(customPixAmount);
      if (isNaN(val) || val <= 0) {
        setFeedbackError('Informe um valor válido em Reais.');
        return;
      }

      setLoading(true);
      const res = await pointsService.buyPointsPix({
        userId: currentUser?.id || wallet?.usuario_id || 'usr_admin_01',
        name: currentUser?.name || wallet?.usuario_nome,
        email: currentUser?.email || wallet?.usuario_email,
        cpf: currentUser?.cpf || wallet?.usuario_cpf,
        valorReais: val,
      });

      setActivePixRequest(res.request);
      setPixCopiaCola(res.copiaECola);
    } catch (err: any) {
      setFeedbackError(err.message || 'Falha ao gerar PIX.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixCopiaCola) return;
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSimulateWebhookPix = async () => {
    if (!activePixRequest) return;
    try {
      setSimulatingPixPayment(true);
      setFeedbackError(null);
      const res = await pointsService.confirmPixPayment(activePixRequest.id);
      setWallet(res.wallet);
      setActivePixRequest(null);
      setPixCopiaCola('');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
      });

      notificationService.dispatchNotification({
        id: `pts_cred_${Date.now()}`,
        title: '💎 Pontos Creditados com Sucesso!',
        body: `Você adquiriu ${res.ledgerEntry.valor} pontos via PIX no Clube VTXMais!`,
        type: 'points_credit',
        createdAt: new Date().toISOString(),
        read: false,
      });

      setActiveTab('overview');
    } catch (err: any) {
      setFeedbackError(err.message || 'Erro ao confirmar PIX.');
    } finally {
      setSimulatingPixPayment(false);
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(withdrawPoints);
    if (isNaN(pts) || pts <= 0) {
      setFeedbackError('Informe um valor de pontos válido.');
      return;
    }
    if (!pixKeyValue.trim()) {
      setFeedbackError('Informe a chave PIX de destino.');
      return;
    }

    try {
      setWithdrawing(true);
      setFeedbackError(null);
      const res = await pointsService.redeemPixWithdrawal({
        userId: currentUser?.id || wallet?.usuario_id || 'usr_admin_01',
        name: currentUser?.name || wallet?.usuario_nome,
        email: currentUser?.email || wallet?.usuario_email,
        cpf: currentUser?.cpf || wallet?.usuario_cpf,
        pontosValor: pts,
        chavePix: {
          tipo: pixKeyType,
          chave: pixKeyValue.trim(),
        },
      });

      setWallet(res.wallet);
      if (res.executadoAutomaticamente) {
        setWithdrawSuccessMsg(
          `✅ Saque PIX de R$ ${pts.toFixed(2)} executado instantaneamente! O valor já foi enviado para sua chave ${pixKeyValue}.`
        );
      } else {
        setWithdrawSuccessMsg(
          `⏳ Solicitação de saque de R$ ${pts.toFixed(2)} enviada para a alçada de aprovação (${res.request.alcada_necessaria.toUpperCase()}). Seus pontos ficaram reservados no saldo bloqueado.`
        );
      }

      notificationService.dispatchNotification({
        id: `pts_saque_${Date.now()}`,
        title: res.executadoAutomaticamente ? '💸 Saque PIX Realizado!' : '⏳ Saque PIX Solicitado',
        body: `Resgate de ${pts} pontos (R$ ${pts.toFixed(2)}) para a chave ${pixKeyValue}.`,
        type: 'points_withdrawal',
        createdAt: new Date().toISOString(),
        read: false,
      });
    } catch (err: any) {
      setFeedbackError(err.message || 'Falha ao solicitar resgate.');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadVal = Number(cardLoadAmount) || 0;

    try {
      setIssuingCard(true);
      setFeedbackError(null);
      const res = await pointsService.issuePrepaidCard({
        userId: currentUser?.id || wallet?.usuario_id || 'usr_admin_01',
        name: currentUser?.name || wallet?.usuario_nome,
        email: currentUser?.email || wallet?.usuario_email,
        cpf: currentUser?.cpf || wallet?.usuario_cpf,
        tipo: cardType,
        valorCarga: loadVal,
        enderecoEntrega: cardType === 'fisico' ? cardAddress : undefined,
      });

      setWallet(res.wallet);
      setCardSuccessMsg(
        cardType === 'virtual'
          ? `🎉 Cartão Virtual emitido com sucesso com carga de ${loadVal} pontos!`
          : `📦 Solicitação de Cartão Físico registrada! Será entregue em ${cardAddress.logradouro}, ${cardAddress.numero}.`
      );

      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setFeedbackError(err.message || 'Falha ao emitir cartão.');
    } finally {
      setIssuingCard(false);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const activeCard = wallet?.cartoes && wallet.cartoes.length > 0 ? wallet.cartoes[0] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
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
            className="relative z-10 bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Módulo Central de Pontos Financeiros</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                    Minha Carteira de Pontos VTXMais
                  </h2>
                  <p className="text-xs text-slate-300">
                    Compre via PIX, resgate valores, use em parceiros ou converta em cartão pré-pago.
                  </p>
                </div>
              </div>

              {/* Main Wallet Balance Hero Banner */}
              <div className="mt-5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider block">
                    Saldo Disponível
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-heading">
                    {wallet ? wallet.saldo_disponivel_pontos.toLocaleString('pt-BR') : '0'}{' '}
                    <span className="text-xs font-normal text-slate-200">pts</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-medium">
                    ≈ {formatBRL(wallet?.saldo_disponivel_pontos || 0)}
                  </span>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                  <span className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider block flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Saldo Bloqueado
                  </span>
                  <div className="text-lg font-bold text-slate-100 font-heading">
                    {wallet ? wallet.saldo_bloqueado_pontos.toLocaleString('pt-BR') : '0'} pts
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Reservado em saques pendentes
                  </span>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                  <span className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider block">
                    Taxa de Paridade
                  </span>
                  <div className="text-lg font-bold text-slate-100 font-heading">
                    {wallet ? `${(wallet.taxa_desconto_pontos * 100).toFixed(1)}%` : '1.0%'}
                  </div>
                  <span className="text-[10px] text-blue-300">
                    Versão otimizada v{wallet?.saldo_version || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 px-4 sm:px-6 bg-slate-50 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Visão Geral
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('buy_pix')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'buy_pix'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Comprar Pontos (PIX)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('withdraw_pix')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'withdraw_pix'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Resgatar (Saque PIX)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'card'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                <span>Cartão Pré-Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('statement')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'statement'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Extrato do Ledger</span>
              </button>
            </div>

            {/* Feedback Notifications */}
            {feedbackError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}
            {withdrawSuccessMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{withdrawSuccessMsg}</span>
              </div>
            )}
            {cardSuccessMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{cardSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body / Tabs Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Action Shortcuts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('buy_pix')}
                      className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-left hover:bg-blue-100/60 transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Comprar Pontos PIX
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Recarregue sua carteira instantaneamente com paridade oficial
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('withdraw_pix')}
                      className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left hover:bg-emerald-100/60 transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Resgatar via PIX
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Transfira pontos convertidos em R$ direto para sua conta bancária
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('card')}
                      className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-left hover:bg-purple-100/60 transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Cartão Pré-Pago
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Use pontos em qualquer estabelecimento virtual ou maquininha
                      </p>
                    </button>
                  </div>

                  {/* Active Card Preview if available */}
                  {activeCard && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white shadow-md relative overflow-hidden border border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 tracking-wider">
                          CARTÃO {activeCard.tipo.toUpperCase()} VTXMAIS
                        </span>
                        <span className="text-xs font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                          {activeCard.bandeira}
                        </span>
                      </div>

                      <div className="my-4 font-mono text-lg sm:text-xl tracking-widest text-slate-100">
                        {activeCard.numero_mascarado}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider block text-slate-400">Titular</span>
                          <span className="font-bold text-white">{activeCard.titular_nome}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider block text-slate-400">Validade</span>
                          <span className="font-bold text-white">{activeCard.validade}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider block text-slate-400">Saldo Carregado</span>
                          <span className="font-black text-amber-300">{formatBRL(activeCard.saldo_cartao)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Activity summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Últimas Movimentações no Ledger
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('statement')}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Ver extrato completo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {wallet?.extrato_recente && wallet.extrato_recente.length > 0 ? (
                        wallet.extrato_recente.slice(0, 4).map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  entry.tipo === 'C'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {entry.tipo === 'C' ? '+' : '-'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-xs">
                                  {entry.descricao}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(entry.data).toLocaleDateString('pt-BR')} às{' '}
                                  {new Date(entry.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-mono font-bold block ${
                                  entry.tipo === 'C' ? 'text-emerald-600' : 'text-slate-900'
                                }`}
                              >
                                {entry.tipo === 'C' ? '+' : '-'}
                                {entry.valor.toLocaleString('pt-BR')} pts
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Saldo: {entry.saldo_posterior.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          Nenhuma movimentação recente registrada nesta carteira.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMPRA PIX */}
              {activeTab === 'buy_pix' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Regra de Conversão e Paridade de Pontos
                    </span>
                    <p className="text-[11px] text-blue-800">
                      Sua taxa atual é de{' '}
                      <strong>{wallet ? (wallet.taxa_desconto_pontos * 100).toFixed(1) : 1}%</strong>. Ao pagar via
                      PIX, os pontos entram com liquidação ACID e ficam imediatamente disponíveis para resgates em parceiros e cartões.
                    </p>
                  </div>

                  {!activePixRequest ? (
                    <div className="space-y-4">
                      {/* Presets */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Selecione o valor da recarga em Reais (R$):
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[50, 100, 250, 500, 1000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setPixAmount(preset);
                                setCustomPixAmount(String(preset));
                              }}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                Number(customPixAmount) === preset
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              R$ {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ou digite outro valor personalizado:
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">R$</span>
                          <input
                            type="number"
                            min="5"
                            max="50000"
                            value={customPixAmount}
                            onChange={(e) => setCustomPixAmount(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="100"
                          />
                        </div>
                      </div>

                      {/* Calculation preview */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600">Pontos a receber após taxa:</span>
                        <span className="font-mono font-black text-blue-600 text-sm">
                          {Math.round(
                            Number(customPixAmount || 0) * (1 - (wallet?.taxa_desconto_pontos || 0.01))
                          ).toLocaleString('pt-BR')}{' '}
                          pontos VTX
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGeneratePix}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>{loading ? 'Gerando QR Code...' : 'Gerar Chave e QR Code PIX'}</span>
                      </button>
                    </div>
                  ) : (
                    /* PIX Generated View */
                    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border-2 border-dashed border-emerald-500 flex items-center justify-center shadow-xs">
                        {/* Mock QR Code Graphic */}
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="0" y="0" width="30" height="30" fill="black" />
                          <rect x="5" y="5" width="20" height="20" fill="white" />
                          <rect x="10" y="10" width="10" height="10" fill="black" />
                          <rect x="70" y="0" width="30" height="30" fill="black" />
                          <rect x="75" y="5" width="20" height="20" fill="white" />
                          <rect x="80" y="10" width="10" height="10" fill="black" />
                          <rect x="0" y="70" width="30" height="30" fill="black" />
                          <rect x="5" y="75" width="20" height="20" fill="white" />
                          <rect x="10" y="80" width="10" height="10" fill="black" />
                          <rect x="40" y="10" width="10" height="20" fill="black" />
                          <rect x="40" y="40" width="20" height="20" fill="black" />
                          <rect x="70" y="40" width="10" height="10" fill="black" />
                          <rect x="85" y="55" width="15" height="15" fill="black" />
                          <rect x="40" y="70" width="20" height="10" fill="black" />
                        </svg>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Valor a pagar:</span>
                        <div className="text-xl font-black text-slate-900">
                          {formatBRL(activePixRequest.valor_reais)}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold block">
                          Crédito garantido: +{activePixRequest.valor_pontos} pontos
                        </span>
                      </div>

                      {/* Copia e Cola */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-bold text-slate-700">PIX Copia e Cola:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixCopiaCola}
                            className="flex-1 p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600 select-all truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Webhook Simulator Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSimulateWebhookPix}
                          disabled={simulatingPixPayment}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{simulatingPixPayment ? 'Confirmando Webhook...' : 'Simular Confirmação PIX / Webhook ACID'}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Idempotência garantida: {activePixRequest.idempotency_key.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SAQUE PIX (LIQUIDAÇÃO FINANCEIRA) */}
              {activeTab === 'withdraw_pix' && (
                <form onSubmit={handleRequestWithdraw} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Regras de Alçadas de Aprovação de Saques:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                      <li><strong>Até R$ 500,00:</strong> Aprovação automática e envio imediato.</li>
                      <li><strong>R$ 500,01 a R$ 5.000,00:</strong> Alçada Supervisor.</li>
                      <li><strong>R$ 5.000,01 a R$ 20.000,00:</strong> Alçada Supervisor + Gerente.</li>
                      <li><strong>Acima de R$ 20.000,01:</strong> Alçada Supervisor + Gerente + Diretor.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantidade de pontos para resgate:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={wallet?.saldo_disponivel_pontos || 100000}
                        value={withdrawPoints}
                        onChange={(e) => setWithdrawPoints(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Ex: 250"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                        = R$ {Number(withdrawPoints || 0).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Disponível para saque imediato:{' '}
                      <strong>{wallet?.saldo_disponivel_pontos || 0} pontos</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipo de Chave PIX:
                      </label>
                      <select
                        value={pixKeyType}
                        onChange={(e: any) => setPixKeyType(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone / Celular</option>
                        <option value="aleatoria">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chave PIX de Destino:
                      </label>
                      <input
                        type="text"
                        value={pixKeyValue}
                        onChange={(e) => setPixKeyValue(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Digite sua chave PIX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawing || !wallet || wallet.saldo_disponivel_pontos <= 0}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{withdrawing ? 'Processando resgate...' : 'Confirmar Solicitação de Saque PIX'}</span>
                  </button>
                </form>
              )}

              {/* TAB 4: CARTÃO PRÉ-PAGO */}
              {activeTab === 'card' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCardType('virtual')}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        cardType === 'virtual'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      💳 Cartão Virtual (Ativação Instantânea)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardType('fisico')}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        cardType === 'fisico'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      📫 Cartão Físico (Entrega em Domicílio)
                    </button>
                  </div>

                  <form onSubmit={handleIssueCard} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Carga inicial de pontos para o cartão:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={wallet?.saldo_disponivel_pontos || 10000}
                        value={cardLoadAmount}
                        onChange={(e) => setCardLoadAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        placeholder="100"
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Os pontos são transferidos do saldo disponível para a reserva de cartões emitidos.
                      </span>
                    </div>

                    {cardType === 'fisico' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                        <span className="font-bold text-slate-900 block">Endereço de Entrega (Reutilizado do Cadastro):</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={cardAddress.logradouro}
                            onChange={(e) => setCardAddress({ ...cardAddress, logradouro: e.target.value })}
                            placeholder="Logradouro"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                          <input
                            type="text"
                            value={cardAddress.numero}
                            onChange={(e) => setCardAddress({ ...cardAddress, numero: e.target.value })}
                            placeholder="Número"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={cardAddress.bairro}
                            onChange={(e) => setCardAddress({ ...cardAddress, bairro: e.target.value })}
                            placeholder="Bairro"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                          <input
                            type="text"
                            value={cardAddress.cidade}
                            onChange={(e) => setCardAddress({ ...cardAddress, cidade: e.target.value })}
                            placeholder="Cidade"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                          <input
                            type="text"
                            value={cardAddress.cep}
                            onChange={(e) => setCardAddress({ ...cardAddress, cep: e.target.value })}
                            placeholder="CEP"
                            className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={issuingCard}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{issuingCard ? 'Emitindo cartão...' : `Emitir Cartão ${cardType === 'virtual' ? 'Virtual' : 'Físico'}`}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: EXTRATO COMPLETO DO LEDGER */}
              {activeTab === 'statement' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Livro-Razão Imutável do Associado
                    </span>
                    <button
                      type="button"
                      onClick={loadWallet}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Atualizar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {wallet?.extrato_recente && wallet.extrato_recente.length > 0 ? (
                      wallet.extrato_recente.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  entry.tipo === 'C'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {entry.tipo === 'C' ? 'CRÉDITO' : 'DÉBITO'}
                              </span>
                              <span className="font-bold text-slate-900">{entry.descricao}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              De: {entry.origem} → Para: {entry.destino}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(entry.data).toLocaleString('pt-BR')} • TxID: {entry.transaction_id.slice(0, 16)} • Versão v{entry.versao}
                            </div>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <span
                              className={`text-sm font-mono font-bold block ${
                                entry.tipo === 'C' ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {entry.tipo === 'C' ? '+' : '-'}
                              {entry.valor.toLocaleString('pt-BR')} pts
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Saldo Final: {entry.saldo_posterior.toLocaleString('pt-BR')} pts
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                        Nenhum lançamento encontrado no extrato.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Ledger auditado e 100% conciliado com a Conta Mãe VTXMais.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Fechar Carteira
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
