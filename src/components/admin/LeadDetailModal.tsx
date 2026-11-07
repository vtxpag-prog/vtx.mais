import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, LeadContactStage, LeadNote, AdminUser } from '../../types';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Tag,
  Clock,
  Send,
  User,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { formatDistance, formatCep } from '../../utils/geo';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  currentUser: AdminUser;
  onClose: () => void;
  onUpdateStage: (leadId: string, newStage: LeadContactStage, note?: string) => Promise<void>;
  onAddNote: (leadId: string, text: string) => Promise<void>;
}

export const STAGES_CONFIG: Record<
  LeadContactStage,
  {
    label: string;
    description: string;
    badgeClass: string;
    headerBg: string;
    borderClass: string;
    dotClass: string;
    colorHex: string;
  }
> = {
  novo: {
    label: 'Novo Lead',
    description: 'Recém-capturado via cupom. Contato ainda não iniciado.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'bg-blue-50/70',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
    colorHex: '#3b82f6',
  },
  contatado: {
    label: 'Contato Iniciado',
    description: 'Primeira abordagem realizada (WhatsApp, ligação ou e-mail).',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    headerBg: 'bg-amber-50/70',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
    colorHex: '#f59e0b',
  },
  em_negociacao: {
    label: 'Em Atendimento',
    description: 'Lead interagindo, tirando dúvidas ou agendando visita/uso.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    headerBg: 'bg-purple-50/70',
    borderClass: 'border-purple-200',
    dotClass: 'bg-purple-500',
    colorHex: '#8b5cf6',
  },
  convertido: {
    label: 'Convertido / Ganho',
    description: 'Cupom utilizado ou compra finalizada com sucesso.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    headerBg: 'bg-emerald-50/70',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
    colorHex: '#10b981',
  },
  perdido: {
    label: 'Perdido / Desistiu',
    description: 'Sem interesse, não respondeu ou cupom expirou.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    headerBg: 'bg-rose-50/70',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-500',
    colorHex: '#f43f5e',
  },
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead: rawLead,
  isOpen,
  currentUser,
  onClose,
  onUpdateStage,
  onAddNote,
}) => {
  const [cachedLead, setCachedLead] = useState<Lead | null>(rawLead);

  useEffect(() => {
    if (rawLead) {
      setCachedLead(rawLead);
    }
  }, [rawLead]);

  const lead = rawLead || cachedLead;

  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isChangingStage, setIsChangingStage] = useState(false);

  const currentStage = lead?.contactStage || 'novo';
  const stageInfo = STAGES_CONFIG[currentStage];

  // Clean phone number for WhatsApp
  const cleanPhone = lead ? lead.phone.replace(/\D/g, '') : '';
  const waUrl = lead
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${lead.name.split(' ')[0]}! Tudo bem? Sou da equipe do Clube VTXMais. Vi que você resgatou o cupom "${lead.couponCode}" da oferta "${lead.offerTitle}" (${lead.partnerName}). Gostaria de saber se precisa de alguma ajuda ou informação para utilizar seu benefício!`
      )}`
    : '';

  const handleStageSelect = async (stage: LeadContactStage) => {
    if (!lead || stage === currentStage || isChangingStage) return;
    try {
      setIsChangingStage(true);
      await onUpdateStage(lead.id, stage);
    } finally {
      setIsChangingStage(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNote.trim() || isSubmittingNote) return;

    try {
      setIsSubmittingNote(true);
      await onAddNote(lead.id, newNote.trim());
      setNewNote('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && lead && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header with Stage Color */}
        <div className={`p-5 border-b ${stageInfo.borderClass} ${stageInfo.headerBg} flex items-start justify-between gap-4`}>
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center font-black text-slate-800 text-lg shrink-0">
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-heading text-slate-900 leading-snug">
                  {lead.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${stageInfo.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${stageInfo.dotClass}`} />
                  {stageInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lead capturado em {new Date(lead.createdAt).toLocaleString('pt-BR')} • {lead.origin}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
              title="Abrir WhatsApp com mensagem pronta"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </a>

            <a
              href={`tel:${lead.phone.replace(/\D/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200"
              title="Ligar para o lead"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Ligar ({lead.phone})</span>
            </a>

            <a
              href={`mailto:${lead.email}?subject=Benefício Clube VTXMais - ${lead.offerTitle}`}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200 truncate"
              title="Enviar e-mail para o lead"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">{lead.email}</span>
            </a>
          </div>

          {/* Phase Selector (Kanban Progression) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Mudar Fase do Contato (Kanban)
              </span>
              <span className="text-[11px] text-slate-500">
                Clique para avançar ou regredir o lead
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(Object.keys(STAGES_CONFIG) as LeadContactStage[]).map((stageKey) => {
                const conf = STAGES_CONFIG[stageKey];
                const isCurrent = stageKey === currentStage;

                return (
                  <button
                    key={stageKey}
                    type="button"
                    disabled={isChangingStage}
                    onClick={() => handleStageSelect(stageKey)}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                      isCurrent
                        ? `${conf.badgeClass} ring-2 ring-blue-500/40 shadow-xs font-black`
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${conf.dotClass}`} />
                    <span className="leading-tight">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lead Information Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Offer & Coupon Details */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-blue-600" />
                Oferta Resgatada
              </div>
              <div>
                <div className="font-bold text-slate-900 leading-snug">{lead.offerTitle}</div>
                <div className="text-[11px] text-blue-700 font-semibold">{lead.partnerName}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-mono font-black text-xs">
                  <span>Código:</span>
                  <span>{lead.couponCode}</span>
                </div>
              </div>
            </div>

            {/* Geolocation & CRM Details */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Localização & Integração
              </div>
              <div className="space-y-1">
                <div className="text-slate-800 font-medium">
                  CEP: <strong className="font-mono">{formatCep(lead.userCep)}</strong>
                  {lead.userCity && ` (${lead.userCity}/${lead.userState})`}
                </div>
                {lead.distanceKm !== undefined && (
                  <div className="text-emerald-700 font-semibold">
                    Distância do parceiro: {formatDistance(lead.distanceKm)}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1">
                  <span>Status Webhook CRM:</span>
                  <span className={`font-bold ${lead.crmStatus === 'sucesso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {lead.crmStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Contact Notes Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 font-heading text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Histórico de Contatos & Anotações</span>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {lead.contactNotes?.length || 0}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Acompanhamento interno da equipe
              </span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNoteSubmit} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ex: Conversei via WhatsApp. Lead tem dúvidas sobre horário de funcionamento da loja..."
                rows={2}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Registrado por: <strong>{currentUser.name || currentUser.username}</strong>
                </span>
                <button
                  type="submit"
                  disabled={!newNote.trim() || isSubmittingNote}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmittingNote ? 'Salvando...' : 'Adicionar Nota'}</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5 pt-1">
              {!lead.contactNotes || lead.contactNotes.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs">
                  Nenhuma anotação registrada ainda para este contato. Adicione a primeira acima!
                </div>
              ) : (
                lead.contactNotes.map((note) => {
                  const noteStage = note.stageAtNote ? STAGES_CONFIG[note.stageAtNote] : null;

                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{note.author}</span>
                          {noteStage && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${noteStage.badgeClass}`}
                            >
                              Fase: {noteStage.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/90 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
          >
            Fechar Detalhes
          </button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
