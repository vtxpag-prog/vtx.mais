import React, { useEffect, useState } from 'react';
import {
  WeeklyPushSchedule,
  PushSendHistoryLog,
  AdminUser,
  DayOfWeek,
  PushTargetAudience,
  Offer,
} from '../../types';
import { api } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import {
  BellRing,
  Calendar,
  Clock,
  Send,
  Plus,
  Edit2,
  Trash2,
  Power,
  Users,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag,
  Sparkles,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Play,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

interface WeeklyPushSchedulerViewProps {
  currentUser: AdminUser;
}

const DAYS_NAMES: { day: DayOfWeek; short: string; label: string }[] = [
  { day: 0, short: 'Dom', label: 'Domingo' },
  { day: 1, short: 'Seg', label: 'Segunda-feira' },
  { day: 2, short: 'Ter', label: 'Terça-feira' },
  { day: 3, short: 'Qua', label: 'Quarta-feira' },
  { day: 4, short: 'Qui', label: 'Quinta-feira' },
  { day: 5, short: 'Sex', label: 'Sexta-feira' },
  { day: 6, short: 'Sáb', label: 'Sábado' },
];

const AUDIENCE_LABELS: Record<
  PushTargetAudience,
  { label: string; count: number; desc: string; badgeColor: string }
> = {
  todos_cadastrados: {
    label: 'Todos os Usuários Cadastrados',
    count: 4850,
    desc: 'Base completa de membros registrados no clube',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  usuarios_sp: {
    label: 'Membros do Estado de SP',
    count: 2940,
    desc: 'Usuários com CEP e perfil na Grande SP e interior',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  usuarios_rj: {
    label: 'Membros do Estado do RJ',
    count: 980,
    desc: 'Usuários no estado do Rio de Janeiro',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  usuarios_mg: {
    label: 'Membros de Minas Gerais',
    count: 650,
    desc: 'Usuários de Belo Horizonte e região',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  categoria_gastronomia: {
    label: 'Interesse: Comer e Beber',
    count: 1920,
    desc: 'Membros que resgataram ofertas de restaurantes e bares',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  categoria_eletronicos: {
    label: 'Interesse: Tecnologia & Eletrônicos',
    count: 1750,
    desc: 'Membros que buscam celulares, TVs e informática',
    badgeColor: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  categoria_saude: {
    label: 'Interesse: Saúde, Beleza & Fitness',
    count: 1480,
    desc: 'Membros que utilizam benefícios de academias e farmácias',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  inativos_7_dias: {
    label: 'Inativos (+7 dias sem resgate)',
    count: 820,
    desc: 'Campanhas de reativação de membros ausentes',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export const WeeklyPushSchedulerView: React.FC<WeeklyPushSchedulerViewProps> = ({
  currentUser,
}) => {
  const [schedules, setSchedules] = useState<WeeklyPushSchedule[]>([]);
  const [history, setHistory] = useState<PushSendHistoryLog[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'history'>('schedules');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyPushSchedule | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formAudience, setFormAudience] = useState<PushTargetAudience>('todos_cadastrados');
  const [formDays, setFormDays] = useState<DayOfWeek[]>([5]);
  const [formTime, setFormTime] = useState('18:00');
  const [formOfferId, setFormOfferId] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  // Feedback banner
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedData, histData, offersData] = await Promise.all([
        api.getPushSchedules(),
        api.getPushHistory(),
        api.getOffers(),
      ]);
      setSchedules(schedData);
      setHistory(histData);
      setOffers(offersData.offers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (message: string, type: 'success' | 'info' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingSchedule(null);
    setFormTitle('🔥 Ofertas Especiais do Fim de Semana!');
    setFormBody('Aproveite até 50% de desconto em restaurantes e lojas parceiras perto de você!');
    setFormAudience('todos_cadastrados');
    setFormDays([5]); // Sexta-feira
    setFormTime('17:30');
    setFormOfferId(offers[0]?.id || '');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: WeeklyPushSchedule) => {
    setEditingSchedule(sched);
    setFormTitle(sched.title);
    setFormBody(sched.body);
    setFormAudience(sched.targetAudience);
    setFormDays(sched.daysOfWeek);
    setFormTime(sched.timeOfDay);
    setFormOfferId(sched.offerId || '');
    setFormActive(sched.active);
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: DayOfWeek) => {
    if (formDays.includes(day)) {
      if (formDays.length === 1) return; // Must have at least 1 day
      setFormDays(formDays.filter((d) => d !== day));
    } else {
      setFormDays([...formDays, day].sort((a, b) => a - b) as DayOfWeek[]);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingSchedule) {
        const updated = await api.updatePushSchedule(editingSchedule.id, {
          title: formTitle,
          body: formBody,
          targetAudience: formAudience,
          daysOfWeek: formDays,
          timeOfDay: formTime,
          offerId: formOfferId || undefined,
          active: formActive,
        });
        setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showNotice('Agendamento semanal atualizado com sucesso!');
      } else {
        const created = await api.createPushSchedule({
          title: formTitle,
          body: formBody,
          targetAudience: formAudience,
          daysOfWeek: formDays,
          timeOfDay: formTime,
          offerId: formOfferId || undefined,
          active: formActive,
          createdBy: currentUser.name || currentUser.username || 'Administrador VTXMais',
        });
        setSchedules([created, ...schedules]);
        showNotice('Novo agendamento semanal programado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.togglePushSchedule(id);
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
      showNotice(
        updated.active
          ? 'Agendamento reativado! Os disparos ocorrerão normalmente.'
          : 'Agendamento pausado com sucesso.',
        'info'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este agendamento semanal?')) return;

    try {
      await api.deletePushSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showNotice('Agendamento removido.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerNow = async (sched: WeeklyPushSchedule, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTriggeringId(sched.id);
      const result = await api.triggerPushSchedule(sched.id);
      setSchedules((prev) => prev.map((s) => (s.id === sched.id ? result.schedule : s)));
      setHistory([result.log, ...history]);

      // Fire real in-app & native notification toast on current client
      await notificationService.dispatchNotification({
        id: 'push_sent_now_' + Date.now(),
        title: sched.title,
        body: sched.body,
        offerId: sched.offerId,
        type: 'system',
        createdAt: new Date().toISOString(),
        read: false,
      });

      showNotice(
        `Disparo imediato enviado para ${result.log.recipientCount.toLocaleString('pt-BR')} usuários!`
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao disparar notificação.');
    } finally {
      setTriggeringId(null);
    }
  };

  // KPIs
  const activeSchedulesCount = schedules.filter((s) => s.active).length;
  const nextScheduled = [...schedules]
    .filter((s) => s.active)
    .sort((a, b) => new Date(a.nextScheduledAt).getTime() - new Date(b.nextScheduledAt).getTime())[0];

  const totalDelivered = history.reduce((sum, h) => sum + h.recipientCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <BellRing className="w-3.5 h-3.5 text-blue-600" />
            <span>Engajamento & Push Semanal Recorrente</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Agendador de Notificações Push Semanais
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Programe disparos automáticos semanais para os membros cadastrados. Selecione dias estratégicos (como quintas e sextas-feiras), defina o horário de maior conversão e monitore o alcance da base.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento Semanal</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-fadeIn flex items-center gap-2.5 text-xs font-semibold ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Schedules */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Agendamentos Ativos
            </span>
            <div className="text-xl font-black text-slate-900 font-heading">
              {activeSchedulesCount}{' '}
              <span className="text-xs font-semibold text-slate-400">
                de {schedules.length}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">
              Disparos automáticos ligados
            </span>
          </div>
        </div>

        {/* Next Run */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Próximo Disparo Programado
            </span>
            <div className="text-xs font-bold text-slate-900 truncate">
              {nextScheduled
                ? new Date(nextScheduled.nextScheduledAt).toLocaleString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Nenhum agendamento'}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {nextScheduled ? nextScheduled.title : 'Configure um novo push'}
            </span>
          </div>
        </div>

        {/* Reachable Users */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Base de Usuários Cadastrados
            </span>
            <div className="text-xl font-black text-emerald-600 font-heading">
              4.850
            </div>
            <span className="text-[10px] text-slate-400">
              Alcançáveis por Push
            </span>
          </div>
        </div>

        {/* Total Deliveries in History */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total de Disparos Entregues
            </span>
            <div className="text-xl font-black text-purple-600 font-heading">
              {totalDelivered.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-slate-400">
              Média de abertura: 36.5%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Agendamentos vs Histórico */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Rotinas Semanais Programadas ({schedules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Histórico de Envios & Entregas ({history.length})</span>
        </button>
      </div>

      {/* TAB 1: Schedules List */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Nenhuma rotina semanal cadastrada
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Crie um agendamento semanal para enviar novidades, cupons de fim de semana ou ofertas gastronômicas aos usuários cadastrados.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Cadastrar Primeiro Agendamento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((sched) => {
                const audConfig = AUDIENCE_LABELS[sched.targetAudience];
                const isTriggering = triggeringId === sched.id;

                return (
                  <div
                    key={sched.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 p-5 space-y-4 shadow-2xs relative overflow-hidden flex flex-col justify-between ${
                      sched.active
                        ? 'border-slate-200/90 hover:border-blue-400'
                        : 'border-slate-200/60 opacity-75 bg-slate-50/50'
                    }`}
                  >
                    {/* Top Status & Recurrence Row */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              sched.active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                sched.active ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {sched.active ? 'Ativo (Disparando)' : 'Pausado'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${audConfig.badgeColor}`}
                          >
                            <Users className="w-3 h-3" />
                            <span>{audConfig.label}</span>
                          </span>
                        </div>

                        {/* Power Toggle Switch */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(sched.id, e)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            sched.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={sched.active ? 'Pausar agendamento' : 'Ativar agendamento'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Title & Body */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {sched.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {sched.body}
                        </p>
                      </div>

                      {/* Days of Week Badges */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Horário: <strong>{sched.timeOfDay}</strong>
                          </span>
                          <span>
                            Próximo:{' '}
                            <strong className="text-slate-800">
                              {new Date(sched.nextScheduledAt).toLocaleString('pt-BR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {DAYS_NAMES.map(({ day, short }) => {
                            const isSelected = sched.daysOfWeek.includes(day);
                            return (
                              <span
                                key={day}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-100 text-slate-400 border-slate-200/80'
                                }`}
                              >
                                {short}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Linked Offer (if any) */}
                      {sched.offerTitle && (
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Oferta Vinculada (Deeplink)
                            </span>
                            <span className="font-bold text-slate-800 truncate block text-[11px]">
                              {sched.offerTitle}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {sched.totalSentCount} envios realizados • ~{sched.estimatedAudienceSize} usuários
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Trigger Now Button */}
                        <button
                          type="button"
                          disabled={isTriggering}
                          onClick={(e) => handleTriggerNow(sched, e)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-2xs cursor-pointer"
                          title="Disparar push agora mesmo para teste e entrega imediata"
                        >
                          <Play className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
                          <span>{isTriggering ? 'Disparando...' : 'Disparar Agora'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sched)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="Editar agendamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(sched.id, e)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="Excluir agendamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Send History Logs */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs font-heading">
              Histórico de Disparos Realizados
            </h4>
            <span className="text-[11px] text-slate-500">
              Registros detalhados de entrega semanal
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Notificação & Mensagem</th>
                  <th className="py-3 px-4">Público Alvo</th>
                  <th className="py-3 px-4">Destinatários</th>
                  <th className="py-3 px-4">Abertura / Cliques</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum disparo registrado no histórico ainda.
                    </td>
                  </tr>
                ) : (
                  history.map((log) => {
                    const audConfig = AUDIENCE_LABELS[log.targetAudience];

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 leading-snug">
                            {log.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {log.body}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${audConfig.badgeColor}`}
                          >
                            {audConfig.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {log.recipientCount.toLocaleString('pt-BR')} usuários
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700">
                              {log.clickRate}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({log.openedCount} cliques)
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Entregue</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(log.sentAt).toLocaleString('pt-BR')}
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

      {/* Modal: Create / Edit Weekly Push Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-slate-900 text-base">
                    {editingSchedule ? 'Editar Agendamento Semanal' : 'Novo Agendamento Push Semanal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina a mensagem, a frequência de dias e o horário de envio automático
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form & Preview Grid */}
            <form onSubmit={handleSaveSchedule} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Form Fields (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Título da Notificação Push *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: 🔥 Sextou com Desconto no Clube VTXMais!"
                      maxLength={65}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Dica: Use emojis para aumentar a taxa de clique</span>
                      <span>{formTitle.length}/65 caracteres</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Mensagem / Texto do Push *
                    </label>
                    <textarea
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="Ex: Aproveite até 50% de desconto em restaurantes e lojas parceiras perto de você neste fim de semana!"
                      rows={3}
                      maxLength={140}
                      required
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none font-medium"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Texto conciso e direto para telas de bloqueio</span>
                      <span>{formBody.length}/140 caracteres</span>
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Segmento de Destinatários *
                    </label>
                    <select
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value as PushTargetAudience)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-hidden"
                    >
                      {(Object.keys(AUDIENCE_LABELS) as PushTargetAudience[]).map((key) => {
                        const item = AUDIENCE_LABELS[key];
                        return (
                          <option key={key} value={key}>
                            {item.label} (~{item.count.toLocaleString('pt-BR')} usuários)
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      {AUDIENCE_LABELS[formAudience].desc}
                    </span>
                  </div>

                  {/* Days of Week Selection */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">
                      Dias da Semana para Envio Automático *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAYS_NAMES.map(({ day, short, label }) => {
                        const isSelected = formDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(day)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={label}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      A notificação será disparada automaticamente em cada um dos dias selecionados.
                    </span>
                  </div>

                  {/* Time of Day */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        Horário do Disparo (Horário de Brasília) *
                      </label>
                      <input
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    {/* Status Active/Paused */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        Status da Rotina
                      </label>
                      <label className="flex items-center gap-2 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formActive}
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-700">
                          {formActive ? 'Ativo (Disparar nos dias previstos)' : 'Pausado'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Linked Offer (Optional) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Oferta Vinculada (Deeplink Opcional)
                    </label>
                    <select
                      value={formOfferId}
                      onChange={(e) => setFormOfferId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 cursor-pointer focus:outline-hidden"
                    >
                      <option value="">Nenhuma oferta específica (Abrir Clube VTXMais)</option>
                      {offers.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.partnerName}: {off.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Live Smartphone Lock Screen Preview (5 cols) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3 bg-slate-100/80 p-4 rounded-3xl border border-slate-200/90">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    Preview em Tempo Real (Tela de Bloqueio)
                  </span>

                  {/* Mobile Device Mockup */}
                  <div className="w-full max-w-[280px] bg-slate-950 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 space-y-4">
                    {/* Speaker notch */}
                    <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />

                    {/* Lock Screen Clock */}
                    <div className="text-center text-white py-1">
                      <div className="text-3xl font-light font-mono tracking-tight">
                        {formTime || '18:00'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formDays.length > 0
                          ? DAYS_NAMES.find((d) => d.day === formDays[0])?.label
                          : 'Sexta-feira'}
                      </div>
                    </div>

                    {/* Push Notification Banner */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 text-white space-y-1.5 shadow-lg animate-fadeIn">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/logo_vtx_mais.png"
                            alt="Logo"
                            className="w-3.5 h-3.5 rounded object-contain bg-white p-0.5"
                          />
                          <span className="font-bold text-slate-200 tracking-wide">
                            CLUBE VTXMAIS
                          </span>
                        </div>
                        <span>agora</span>
                      </div>

                      <div className="font-bold text-xs text-white leading-tight">
                        {formTitle || 'Título da notificação'}
                      </div>

                      <div className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                        {formBody || 'Corpo da notificação aparecerá aqui...'}
                      </div>
                    </div>

                    {/* Unlock indicator */}
                    <div className="pt-8 pb-1 text-center">
                      <div className="w-16 h-1 bg-slate-600 rounded-full mx-auto" />
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 text-center max-w-[240px]">
                    Visualização simulada de como a notificação será entregue aos dispositivos móveis.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !formTitle.trim() || !formBody.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
