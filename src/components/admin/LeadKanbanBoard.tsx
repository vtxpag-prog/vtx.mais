import React, { useState } from 'react';
import { Lead, LeadContactStage, AdminUser } from '../../types';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Tag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Flame,
  MessageSquare,
  Users,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { formatDistance, formatCep } from '../../utils/geo';
import { STAGES_CONFIG, LeadDetailModal } from './LeadDetailModal';

interface LeadKanbanBoardProps {
  leads: Lead[];
  currentUser: AdminUser;
  onUpdateStage: (leadId: string, newStage: LeadContactStage, note?: string) => Promise<void>;
  onAddNote: (leadId: string, text: string) => Promise<void>;
}

const STAGE_ORDER: LeadContactStage[] = [
  'novo',
  'contatado',
  'em_negociacao',
  'convertido',
  'perdido',
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  currentUser,
  onUpdateStage,
  onAddNote,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadContactStage | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Group leads by stage (fallback to 'novo' if undefined)
  const leadsByStage = STAGE_ORDER.reduce<Record<LeadContactStage, Lead[]>>(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => (l.contactStage || 'novo') === stage);
      return acc;
    },
    {
      novo: [],
      contatado: [],
      em_negociacao: [],
      convertido: [],
      perdido: [],
    }
  );

  // Funnel conversion metrics
  const totalLeads = leads.length;
  const contactedCount = leads.filter((l) => (l.contactStage || 'novo') !== 'novo').length;
  const convertedCount = leadsByStage.convertido.length;
  const lostCount = leadsByStage.perdido.length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;
  const contactRate = totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadContactStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadContactStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDraggedLeadId(null);

    if (!leadId) return;
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || (targetLead.contactStage || 'novo') === targetStage) return;

    await onUpdateStage(leadId, targetStage);
  };

  const handleMoveStage = async (lead: Lead, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = STAGE_ORDER.indexOf(lead.contactStage || 'novo');
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;

    if (newIdx >= 0 && newIdx < STAGE_ORDER.length) {
      const nextStage = STAGE_ORDER[newIdx];
      await onUpdateStage(lead.id, nextStage);
    }
  };

  const handleCopyCoupon = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCouponId(code);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics / Funnel Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total no Funil
            </div>
            <div className="text-xl font-black text-slate-900 font-heading">
              {totalLeads}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 border-l border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Contatados
            </div>
            <div className="text-xl font-black text-amber-700 font-heading">
              {contactedCount} <span className="text-xs font-semibold text-slate-400">({contactRate}%)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 border-l border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </div>
            <div className="text-xl font-black text-emerald-600 font-heading">
              {conversionRate}% <span className="text-xs font-semibold text-slate-400">({convertedCount})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 border-l border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Perdidos / Desistentes
            </div>
            <div className="text-xl font-black text-rose-600 font-heading">
              {lostCount}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Columns Horizontal Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
        {STAGE_ORDER.map((stageKey) => {
          const config = STAGES_CONFIG[stageKey];
          const columnLeads = leadsByStage[stageKey];
          const isOver = dragOverStage === stageKey;
          const stageIndex = STAGE_ORDER.indexOf(stageKey);

          return (
            <div
              key={stageKey}
              onDragOver={(e) => handleDragOver(e, stageKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stageKey)}
              className={`flex flex-col bg-slate-100/80 rounded-3xl border transition-all duration-200 min-h-[500px] overflow-hidden ${
                isOver
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b ${config.borderClass} ${config.headerBg} flex items-center justify-between sticky top-0 z-10`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
                  <h4 className="text-xs font-bold font-heading text-slate-900 tracking-tight">
                    {config.label}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200/90 text-slate-800 shadow-2xs">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {columnLeads.length === 0 ? (
                  <div
                    className={`py-12 px-3 text-center border-2 border-dashed rounded-2xl text-[11px] transition-colors ${
                      isOver
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200/80 text-slate-400'
                    }`}
                  >
                    {isOver ? 'Solte o lead aqui' : 'Nenhum lead nesta fase'}
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const cleanPhone = lead.phone.replace(/\D/g, '');
                    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                      `Olá ${lead.name.split(' ')[0]}! Tudo bem? Vi que você resgatou o cupom "${lead.couponCode}" no Clube VTXMais (${lead.partnerName}). Posso te ajudar com alguma dúvida sobre o desconto?`
                    )}`;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 p-3 space-y-2.5 cursor-grab active:cursor-grabbing group shadow-2xs"
                      >
                        {/* Card Header: Initials + Name + Date */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                              {lead.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition truncate leading-snug">
                                {lead.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 truncate">
                                {lead.email}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Partner & Offer Tag */}
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                          <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.partnerName}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium line-clamp-1">
                            {lead.offerTitle}
                          </div>
                        </div>

                        {/* Coupon Code Pill */}
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg truncate">
                            <Tag className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{lead.couponCode}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleCopyCoupon(lead.couponCode, e)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer"
                            title="Copiar cupom"
                          >
                            {copiedCouponId === lead.couponCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Location & Proximity */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {lead.userCity ? `${lead.userCity}/${lead.userState}` : `CEP: ${formatCep(lead.userCep)}`}
                          </span>
                          {lead.distanceKm !== undefined && (
                            <span className="text-emerald-700 font-bold ml-auto shrink-0">
                              {formatDistance(lead.distanceKm)}
                            </span>
                          )}
                        </div>

                        {/* Latest Note preview (if any) */}
                        {lead.contactNotes && lead.contactNotes.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-amber-50/70 border border-amber-200/80 p-1.5 rounded-lg">
                            <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{lead.contactNotes[0].text}</span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-bold ml-auto">
                              ({lead.contactNotes.length})
                            </span>
                          </div>
                        )}

                        {/* Bottom Actions Toolbar: WhatsApp, Stage progression */}
                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                          {/* 1-Click WhatsApp Trigger */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-2xs"
                            title="Conversar com lead no WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Stage Navigation Arrows */}
                          <div className="flex items-center gap-1 ml-auto">
                            {stageIndex > 0 && (
                              <button
                                type="button"
                                onClick={(e) => handleMoveStage(lead, 'prev', e)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                title="Recuar para fase anterior"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stageIndex < STAGE_ORDER.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleMoveStage(lead, 'next', e)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                title="Avançar para próxima fase"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail & History Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          currentUser={currentUser}
          onClose={() => setSelectedLead(null)}
          onUpdateStage={async (id, stage, note) => {
            await onUpdateStage(id, stage, note);
            const updated = leads.find((l) => l.id === id);
            if (updated) {
              setSelectedLead({ ...updated, contactStage: stage });
            }
          }}
          onAddNote={async (id, text) => {
            await onAddNote(id, text);
            const updated = leads.find((l) => l.id === id);
            if (updated) {
              setSelectedLead({ ...updated });
            }
          }}
        />
      )}
    </div>
  );
};
