import React, { useState, useEffect, useMemo } from 'react';
import { AdvertiserLead, AdvertiserKanbanStage, CategoryName, Lead } from '../../types';
import { api } from '../../services/api';
import {
  Building2,
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  BarChart3,
  X,
  Send,
  MoreVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdvertiserKanbanViewProps {
  onRefreshNotifications?: () => void;
}

const ADVERTISER_STAGES: Array<{ id: AdvertiserKanbanStage; label: string; color: string; bg: string; border: string }> = [
  { id: 'novo_cadastro', label: '1. Novo Cadastro (SLA 24h)', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'em_negociacao', label: '2. Em Abordagem / Negociação', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'proposta_enviada', label: '3. Proposta Enviada', color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'contrato_fechado', label: '4. Contrato Ativo / Fechado', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'perdido_pausado', label: '5. Pausado / Perdido', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
];

export const AdvertiserKanbanView: React.FC<AdvertiserKanbanViewProps> = ({
  onRefreshNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'advertisers' | 'clients' | 'dashboard'>('advertisers');
  const [advertisers, setAdvertisers] = useState<AdvertiserLead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Notes Modal state
  const [activeNoteModal, setActiveNoteModal] = useState<AdvertiserLead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Add Advertiser modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdvData, setNewAdvData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
    category: 'Comer e Beber' as CategoryName,
    city: 'São Paulo',
    state: 'SP',
    discountProposal: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [advs, lds] = await Promise.all([
        api.getAdvertisers(),
        api.getLeads(),
      ]);
      setAdvertisers(advs);
      setLeads(lds);
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error('Error loading CRM data:', err);
    }
  };

  const handleMoveStage = async (id: string, newStage: AdvertiserKanbanStage) => {
    try {
      const updated = await api.updateAdvertiserStage(id, newStage);
      setAdvertisers((prev) => prev.map((a) => (a.id === id ? updated : a)));

      if (newStage === 'contrato_fechado') {
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
        } catch {}
      }
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleAddNote = async () => {
    if (!activeNoteModal || !newNoteText.trim()) return;

    try {
      const updated = await api.addAdvertiserNote(activeNoteModal.id, newNoteText.trim());
      setAdvertisers((prev) => prev.map((a) => (a.id === activeNoteModal.id ? updated : a)));
      setActiveNoteModal(updated);
      setNewNoteText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleConvertToPartner = async (advId: string) => {
    try {
      const res = await api.convertAdvertiserToPartner(advId);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}
      alert(`Sucesso! ${res.message}`);
      loadData();
      if (activeNoteModal) setActiveNoteModal(null);
    } catch (err: any) {
      alert(err.message || 'Falha ao converter anunciante.');
    }
  };

  const handleCreateAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvData.companyName || !newAdvData.contactName || !newAdvData.phone || !newAdvData.email) return;

    try {
      const res = await api.submitAdvertiser(newAdvData);
      setAdvertisers((prev) => [res.advertiser, ...prev]);
      setShowAddModal(false);
      setNewAdvData({
        companyName: '',
        tradeName: '',
        cnpj: '',
        contactName: '',
        email: '',
        phone: '',
        category: 'Comer e Beber',
        city: 'São Paulo',
        state: 'SP',
        discountProposal: '',
      });
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error('Failed to create advertiser:', err);
    }
  };

  // Helper for WhatsApp link
  const getWhatsAppLink = (phone: string, name: string) => {
    const raw = phone.replace(/\D/g, '');
    const cleanNumber = raw.startsWith('55') ? raw : `55${raw}`;
    const text = `Olá ${name}! Sou da equipe comercial do Clube VTXMais. Recebemos o cadastro da sua empresa para ser parceira anunciante. Podemos conversar sobre os benefícios para os associados?`;
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
  };

  // SLA Calculation
  const getSlaStatus = (adv: AdvertiserLead) => {
    const now = Date.now();
    const referenceTime = adv.lastContactAt ? new Date(adv.lastContactAt).getTime() : new Date(adv.createdAt).getTime();
    const hours = Math.round((now - referenceTime) / (3600 * 1000));
    const isBreached = hours >= (adv.slaDeadlineHours || 24);
    const isWarning = hours >= 12 && !isBreached;

    return {
      hours,
      isBreached,
      isWarning,
      badgeText: isBreached ? `🚨 ${hours}h sem retorno (SLA Estourado)` : isWarning ? `⚠️ ${hours}h (Atenção ao SLA)` : `⏱️ ${hours}h sem contato`,
      badgeClass: isBreached
        ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse'
        : isWarning
        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
        : 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Filtered Advertisers
  const filteredAdvertisers = useMemo(() => {
    return advertisers.filter((a) => {
      if (selectedCategory !== 'todas' && a.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = a.companyName?.toLowerCase().includes(q) || a.tradeName?.toLowerCase().includes(q);
        const matchContact = a.contactName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q);
        const matchCity = a.city?.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchCity) return false;
      }
      return true;
    });
  }, [advertisers, selectedCategory, searchQuery]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-slate-900">
                CRM Nativo VTXMais
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Kanban & SLA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Acompanhamento comercial de anunciantes e gestão de relacionamento com associados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Main Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('advertisers')}
              className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'advertisers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Anunciantes ({advertisers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clientes & Leads ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Métricas & SLA</span>
            </button>
          </div>

          {activeTab === 'advertisers' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Anunciante</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: KANBAN DE ANUNCIANTES ================= */}
      {activeTab === 'advertisers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por empresa, contato, e-mail, telefone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                {filteredAdvertisers.length} empresas encontradas
              </span>
            </div>
          </div>

          {/* Kanban Board Columns Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
            {ADVERTISER_STAGES.map((col, colIdx) => {
              const items = filteredAdvertisers.filter((a) => a.kanbanStage === col.id);

              return (
                <div
                  key={col.id}
                  className={`bg-slate-50/80 rounded-2xl border ${col.border} p-3 space-y-3 min-w-[240px] flex flex-col`}
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-xl ${col.bg} border ${col.border} flex items-center justify-between`}>
                    <span className={`text-xs font-bold font-heading truncate ${col.color}`}>
                      {col.label}
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white shadow-2xs ${col.color}`}>
                      {items.length}
                    </span>
                  </div>

                  {/* Cards List in Column */}
                  <div className="space-y-3 min-h-[300px]">
                    {items.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Nenhuma empresa neste estágio
                      </div>
                    ) : (
                      items.map((adv) => {
                        const sla = getSlaStatus(adv);

                        return (
                          <div
                            key={adv.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs hover:shadow-md transition-all group"
                          >
                            {/* Card Top: SLA Badge & Category */}
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-600 truncate">
                                {adv.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${sla.badgeClass}`}>
                                {sla.badgeText}
                              </span>
                            </div>

                            {/* Company Name & Trade Name */}
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm font-heading leading-tight group-hover:text-blue-600 transition">
                                {adv.tradeName || adv.companyName}
                              </h4>
                              {adv.tradeName && adv.tradeName !== adv.companyName && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {adv.companyName}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                <strong>Proposta:</strong> {adv.discountProposal}
                              </p>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                              <div className="font-semibold text-slate-800 truncate">
                                👤 {adv.contactName}
                              </div>
                              <div className="truncate text-slate-500">
                                ✉️ {adv.email}
                              </div>
                              <div className="font-mono text-slate-700">
                                📞 {adv.phone}
                              </div>
                            </div>

                            {/* Quick Action Contact Buttons */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <a
                                href={getWhatsAppLink(adv.phone, adv.contactName)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 px-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] transition flex items-center justify-center gap-1 shadow-2xs"
                                title="Conversar no WhatsApp com mensagem de abordagem comercial"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => setActiveNoteModal(adv)}
                                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                title="Ver ou adicionar notas do CRM"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Button to convert into official partner if contract closed */}
                            {(adv.kanbanStage === 'contrato_fechado' || adv.kanbanStage === 'proposta_enviada') && (
                              <button
                                type="button"
                                onClick={() => handleConvertToPartner(adv.id)}
                                className="w-full mt-1.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[10px] shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Transformar este anunciante em Parceiro Ativo oficial do Clube"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Ativar como Parceiro Oficial</span>
                              </button>
                            )}

                            {/* Kanban Move Controls */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                              {colIdx > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStage(adv.id, ADVERTISER_STAGES[colIdx - 1].id)}
                                  className="text-slate-500 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-bold"
                                  title="Voltar estágio"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>Voltar</span>
                                </button>
                              ) : (
                                <span />
                              )}

                              {colIdx < ADVERTISER_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStage(adv.id, ADVERTISER_STAGES[colIdx + 1].id)}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer font-bold ml-auto"
                                  title="Avançar estágio no funil comercial"
                                >
                                  <span>Avançar</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
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
        </div>
      )}

      {/* ================= TAB 2: KANBAN / LEADS DE CLIENTES ================= */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Leads & Usuários Cadastrados no CRM
              </h3>
              <p className="text-xs text-slate-500">
                Clientes que resgataram cupons e estão cadastrados no banco interno
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              {leads.length} Leads Ativos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Nome do Cliente</th>
                  <th className="p-3.5">Contato</th>
                  <th className="p-3.5">Oferta / Cupom</th>
                  <th className="p-3.5">Data de Resgate</th>
                  <th className="p-3.5">Ações CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{l.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{l.userCity || 'São Paulo'} - {l.userState || 'SP'}</div>
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <div>{l.email}</div>
                      <div className="font-mono text-slate-500">{l.phone}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 truncate max-w-xs">{l.offerTitle}</div>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-black rounded border border-blue-200">
                        {l.couponCode}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(l.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(l.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <a
                        href={getWhatsAppLink(l.phone, l.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contato WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DASHBOARD METRICS & SLA ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total de Anunciantes no CRM
              </div>
              <div className="text-3xl font-black text-slate-900 font-heading">
                {advertisers.length}
              </div>
              <div className="text-xs text-blue-600 font-medium">Empresas no funil comercial</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Contratos Fechados
              </div>
              <div className="text-3xl font-black text-emerald-600 font-heading">
                {advertisers.filter((a) => a.kanbanStage === 'contrato_fechado').length}
              </div>
              <div className="text-xs text-emerald-700 font-medium">Marcas parceiras ativas</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Tempo Médio de Primeiro Contato
              </div>
              <div className="text-3xl font-black text-amber-800 font-heading">
                14.2h
              </div>
              <div className="text-xs text-amber-700 font-medium">Meta SLA: &lt; 24h</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Alertas SLA Ativos
              </div>
              <div className="text-3xl font-black text-rose-600 font-heading">
                {advertisers.filter((a) => getSlaStatus(a).isBreached).length}
              </div>
              <div className="text-xs text-rose-600 font-medium">Necessitam de ação imediata</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Advertiser manually */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">
                Adicionar Novo Anunciante no CRM
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdvertiser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Razão Social / Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  value={newAdvData.companyName}
                  onChange={(e) => setNewAdvData({ ...newAdvData, companyName: e.target.value })}
                  placeholder="Nome da empresa"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome do Responsável *</label>
                  <input
                    type="text"
                    required
                    value={newAdvData.contactName}
                    onChange={(e) => setNewAdvData({ ...newAdvData, contactName: e.target.value })}
                    placeholder="Contato principal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newAdvData.phone}
                    onChange={(e) => setNewAdvData({ ...newAdvData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail Comercial *</label>
                <input
                  type="email"
                  required
                  value={newAdvData.email}
                  onChange={(e) => setNewAdvData({ ...newAdvData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Proposta de Desconto para Sócios</label>
                <input
                  type="text"
                  value={newAdvData.discountProposal}
                  onChange={(e) => setNewAdvData({ ...newAdvData, discountProposal: e.target.value })}
                  placeholder="Ex: 25% OFF em todo o cardápio"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Adicionar ao Kanban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Interaction Notes */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Histórico & Notas de Abordagem
                </h3>
                <span className="text-xs text-slate-500">
                  {activeNoteModal.companyName} ({activeNoteModal.contactName})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Existing notes */}
            <div className="max-h-52 overflow-y-auto space-y-2 text-xs">
              {activeNoteModal.notes && activeNoteModal.notes.length > 0 ? (
                activeNoteModal.notes.map((n, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    {n}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">Nenhuma anotação registrada ainda.</p>
              )}
            </div>

            {/* Add note input */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Adicionar nova anotação da conversa..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Salvar Anotação no CRM
              </button>

              <button
                type="button"
                onClick={() => handleConvertToPartner(activeNoteModal.id)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Converter Empresa em Parceiro Oficial Ativo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
