import React, { useEffect, useState } from 'react';
import { Lead, AdminUser, LeadContactStage } from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Download,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  TrendingUp,
  MapPin,
  Tag,
  Kanban,
  Table as TableIcon,
  MessageCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES_LIST } from '../CategoryBar';
import { formatDistance, formatCep } from '../../utils/geo';
import { LeadKanbanBoard } from './LeadKanbanBoard';
import { LeadDetailModal, STAGES_CONFIG } from './LeadDetailModal';

interface LeadsViewProps {
  currentUser: AdminUser;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ currentUser }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: Kanban vs Table
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Selected lead for detail modal (when in table view or clicked)
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<Lead | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStage, setSelectedStage] = useState<string>('Todas');
  const [periodDays, setPeriodDays] = useState<number | undefined>(undefined);
  const [couponCodeFilter, setCouponCodeFilter] = useState('');

  useEffect(() => {
    loadLeads();
  }, [selectedCategory, periodDays]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads({
        category: selectedCategory === 'Todas' ? undefined : selectedCategory,
        period: periodDays,
        couponCode: couponCodeFilter || undefined,
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (leadId: string, newStage: LeadContactStage, note?: string) => {
    try {
      const author = currentUser.name || currentUser.username || 'Equipe Comercial';
      const updated = await api.updateLeadStage(leadId, newStage, note, author);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLeadForModal && selectedLeadForModal.id === leadId) {
        setSelectedLeadForModal(updated);
      }
    } catch (err) {
      console.error('Falha ao atualizar fase do lead:', err);
    }
  };

  const handleAddNote = async (leadId: string, text: string) => {
    try {
      const author = currentUser.name || currentUser.username || 'Equipe Comercial';
      const updated = await api.addLeadNote(leadId, text, author);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLeadForModal && selectedLeadForModal.id === leadId) {
        setSelectedLeadForModal(updated);
      }
    } catch (err) {
      console.error('Falha ao adicionar nota ao lead:', err);
    }
  };

  const handleExportCsv = () => {
    const url = api.getLeadsCsvUrl({
      search: searchTerm || undefined,
      category: selectedCategory === 'Todas' ? undefined : selectedCategory,
      period: periodDays,
      couponCode: couponCodeFilter || undefined,
    });
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads-vtxmais-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side filtering
  const filteredLeads = leads.filter((lead) => {
    // Stage filter
    if (selectedStage !== 'Todas') {
      const stage = lead.contactStage || 'novo';
      if (stage !== selectedStage) return false;
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.couponCode.toLowerCase().includes(q) ||
      lead.offerTitle.toLowerCase().includes(q) ||
      lead.partnerName.toLowerCase().includes(q) ||
      lead.userCep.includes(q)
    );
  });

  const successCrmCount = filteredLeads.filter((l) => l.crmStatus === 'sucesso').length;

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>CRM & Gestão de Contatos</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-heading mt-1">
            Leads Capturados & Acompanhamento de Fases
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Gerencie o pipeline de contato com os membros que resgataram cupons. Acompanhe as fases no Kanban, inicie conversas no WhatsApp e registre histórico de interações.
          </p>
        </div>

        {/* View Switcher Toggle & CSV Export */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-blue-600" />
              <span>Kanban de Fases</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Visão Tabela</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Exportar todos os leads filtrados em formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2 flex-wrap">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email, telefone, parceiro ou cupom..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Contact Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="Todas">Todas as Fases do Contato</option>
            <option value="novo">Fase: Novo Lead</option>
            <option value="contatado">Fase: Contato Iniciado</option>
            <option value="em_negociacao">Fase: Em Atendimento</option>
            <option value="convertido">Fase: Convertido / Ganho</option>
            <option value="perdido">Fase: Perdido / Desistiu</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="Todas">Todas as Categorias</option>
            {CATEGORIES_LIST.filter((c) => c.name !== 'Todas as Categorias').map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Period Filter */}
          <select
            value={periodDays === undefined ? '' : periodDays}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              setPeriodDays(val);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="">Todo o Período</option>
            <option value="1">Hoje (Últimas 24h)</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadLeads}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center justify-center cursor-pointer shrink-0"
          title="Recarregar leads"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main View Area: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <LeadKanbanBoard
          leads={filteredLeads}
          currentUser={currentUser}
          onUpdateStage={handleUpdateStage}
          onAddNote={handleAddNote}
        />
      ) : (
        /* Leads Table View */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Lead (Nome & Contato)</th>
                  <th className="py-3 px-4">Fase do Contato (Kanban)</th>
                  <th className="py-3 px-4">Telefone / WhatsApp</th>
                  <th className="py-3 px-4">Cupom Resgatado</th>
                  <th className="py-3 px-4">CEP / Distância</th>
                  <th className="py-3 px-4">Status Webhook CRM</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const currentStage = lead.contactStage || 'novo';
                    const stageInfo = STAGES_CONFIG[currentStage];
                    const cleanPhone = lead.phone.replace(/\D/g, '');
                    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                      `Olá ${lead.name.split(' ')[0]}! Sou do Clube VTXMais. Vi que você resgatou o cupom "${lead.couponCode}" (${lead.partnerName}). Gostaria de saber se precisa de ajuda!`
                    )}`;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition group">
                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadForModal(lead)}
                            className="text-left cursor-pointer group-hover:text-blue-600"
                          >
                            <div className="font-bold text-slate-900 leading-snug">{lead.name}</div>
                            <div className="text-[11px] text-slate-500">{lead.email}</div>
                          </button>
                        </td>

                        {/* Contact Stage Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={currentStage}
                            onChange={(e) =>
                              handleUpdateStage(lead.id, e.target.value as LeadContactStage)
                            }
                            className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-hidden transition shadow-2xs ${stageInfo.badgeClass}`}
                          >
                            <option value="novo">Novo Lead</option>
                            <option value="contatado">Contato Iniciado</option>
                            <option value="em_negociacao">Em Atendimento</option>
                            <option value="convertido">Convertido / Ganho</option>
                            <option value="perdido">Perdido / Desistiu</option>
                          </select>
                        </td>

                        {/* Phone / WhatsApp */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-slate-700">
                              {lead.phone}
                            </span>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Coupon */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] block w-fit">
                            {lead.couponCode}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-xs mt-0.5">
                            {lead.partnerName}: {lead.offerTitle}
                          </span>
                        </td>

                        {/* CEP & Distance */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{formatCep(lead.userCep)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {lead.userCity ? `${lead.userCity}/${lead.userState}` : ''}
                            {lead.distanceKm !== undefined ? ` • ${formatDistance(lead.distanceKm)}` : ''}
                          </span>
                        </td>

                        {/* CRM Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.crmStatus === 'sucesso'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {lead.crmStatus === 'sucesso' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {lead.crmStatus.toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadForModal(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                            title="Ver histórico e notas do lead"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Acompanhar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Lead Details from Table */}
      {selectedLeadForModal && (
        <LeadDetailModal
          lead={selectedLeadForModal}
          isOpen={!!selectedLeadForModal}
          currentUser={currentUser}
          onClose={() => setSelectedLeadForModal(null)}
          onUpdateStage={async (id, stage, note) => {
            await handleUpdateStage(id, stage, note);
          }}
          onAddNote={async (id, text) => {
            await handleAddNote(id, text);
          }}
        />
      )}
    </div>
  );
};
