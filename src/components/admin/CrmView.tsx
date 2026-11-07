import React, { useEffect, useState } from 'react';
import { CRMConfig, CRMLog, AdminUser, CRMHealthReport } from '../../types';
import { api } from '../../services/api';
import { CrmWebhookHealthCard } from './CrmWebhookHealthCard';
import {
  Webhook,
  KeyRound,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Save,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Server,
  ArrowRight,
  Kanban,
} from 'lucide-react';

interface CrmViewProps {
  currentUser: AdminUser;
  onNavigateToLeads?: () => void;
}

export const CrmView: React.FC<CrmViewProps> = ({ currentUser, onNavigateToLeads }) => {
  const [config, setConfig] = useState<CRMConfig | null>(null);
  const [logs, setLogs] = useState<CRMLog[]>([]);
  const [healthReport, setHealthReport] = useState<CRMHealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; payloadSent?: any } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = currentUser.role === 'admin';

  useEffect(() => {
    loadCrm();
  }, []);

  const loadCrm = async () => {
    try {
      setLoading(true);
      const [cfg, logsData, health] = await Promise.all([
        api.getCrmConfig(),
        api.getCrmLogs(),
        api.getCrmHealth().catch(() => null),
      ]);
      setConfig(cfg);
      setLogs(logsData);
      setHealthReport(health);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHealth = async () => {
    try {
      setHealthLoading(true);
      const updatedReport = await api.testCrmHealth();
      setHealthReport(updatedReport);
      // Reload logs and config
      const [cfg, logsData] = await Promise.all([api.getCrmConfig(), api.getCrmLogs()]);
      setConfig(cfg);
      setLogs(logsData);
    } catch (err: any) {
      alert(err.message || 'Falha ao testar conexão de saúde');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !canEdit) return;

    try {
      const updated = await api.updateCrmConfig(config);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configuração do CRM');
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testCrmConnection(config.webhookUrl, config.apiKey);
      setTestResult(res);
      // Reload logs
      const updatedLogs = await api.getCrmLogs();
      setLogs(updatedLogs);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Falha ao testar conexão com Webhook',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kanban Shortcut Banner */}
      {onNavigateToLeads && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-heading">
                Acompanhamento de Leads no Kanban de Fases
              </h3>
              <p className="text-[11px] text-slate-300">
                Acompanhe as fases de contato dos membros que resgataram cupons, registre notas e converse no WhatsApp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToLeads}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <span>Abrir Kanban de Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Webhook className="w-3.5 h-3.5 text-blue-600" />
            <span>Automação & Disparo de Leads em Tempo Real</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Integração CRM & Disparo de Webhook
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Cada vez que um visitante preenche o formulário para resgatar um cupom, um payload estruturado é disparado instantaneamente para seu CRM (HubSpot, RD Station, ActiveCampaign ou Endpoint Customizado).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-amber-400 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testando Disparo...' : 'Testar Conexão Webhook'}</span>
          </button>
        </div>
      </div>

      {/* Monitor de Saúde e Conectividade do Webhook CRM (.env) */}
      <CrmWebhookHealthCard
        report={healthReport}
        onRefresh={handleRefreshHealth}
        loading={healthLoading}
      />

      {/* Test Connection Alert Box */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  {testResult.success ? 'Conexão Bem-Sucedida!' : 'Falha na Conexão'}
                </h4>
                <p className="text-xs mt-0.5">{testResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {testResult.payloadSent && (
            <div className="mt-3 pt-3 border-t border-emerald-200/60">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                Payload JSON Enviado no Teste:
              </span>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36">
                {JSON.stringify(testResult.payloadSent, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Credenciais do Webhook Externo
              </h3>
              <p className="text-xs text-slate-500">
                Configure a URL de destino e a chave de autenticação
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Ativar Disparos de Webhook</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Webhook URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL do Webhook (Endpoint Receptor) *
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  disabled={!canEdit}
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://api.seucrm.com/v1/webhook"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Aceita URLs do Webhook.site, RD Station Marketing, HubSpot, Make, Zapier ou servidor próprio.
              </p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chave de API / Token Secreto (Bearer Token)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  disabled={!canEdit}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="vtx_live_sec_..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Provider Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Provedor / Identificador
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={config.providerName}
                onChange={(e) => setConfig({ ...config, providerName: e.target.value })}
                placeholder="Ex: RD Station / HubSpot"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Field Mapping Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Mapeamento de Campos (JSON Payload)
            </h3>
            <p className="text-xs text-slate-500">
              Personalize o nome das propriedades enviadas para se adequar ao esquema do seu CRM
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Nome do Lead', key: 'leadName' as const, defaultVal: 'nome_completo' },
              { label: 'E-mail do Lead', key: 'leadEmail' as const, defaultVal: 'email_contato' },
              { label: 'Telefone / WhatsApp', key: 'leadPhone' as const, defaultVal: 'telefone_whatsapp' },
              { label: 'Código do Cupom', key: 'couponCode' as const, defaultVal: 'codigo_cupom_resgatado' },
              { label: 'Título da Oferta', key: 'couponTitle' as const, defaultVal: 'oferta_titulo' },
              { label: 'Categoria da Oferta', key: 'category' as const, defaultVal: 'categoria_interesse' },
              { label: 'CEP do Usuário', key: 'cep' as const, defaultVal: 'cep_usuario' },
              { label: 'Data e Hora', key: 'timestamp' as const, defaultVal: 'data_resgate' },
              { label: 'Origem do Tráfego', key: 'origin' as const, defaultVal: 'origem_captura' },
            ].map((field) => (
              <div key={field.key} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  {field.label}
                </span>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={config.fieldMapping[field.key]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      fieldMapping: {
                        ...config.fieldMapping,
                        [field.key]: e.target.value,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-hidden disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        {canEdit && (
          <div className="flex items-center justify-end gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Configurações salvas com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações do CRM</span>
            </button>
          </div>
        )}
      </form>

      {/* CRM Logs Inspector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Histórico de Disparos de Webhook (Logs)
            </h3>
            <p className="text-xs text-slate-500">
              Auditoria de requisições enviadas e respostas recebidas
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {logs.length} registros recentes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Lead</th>
                <th className="py-2.5 px-3">Status HTTP</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Payload Enviado</th>
                <th className="py-2.5 px-3 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                    Nenhum disparo registrado ainda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">
                      {log.leadName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.success
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status} {log.success ? 'OK' : 'ERRO'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                      {log.endpoint}
                    </td>
                    <td className="py-2.5 px-3">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:underline text-[10px] font-sans font-semibold">
                          Ver JSON
                        </summary>
                        <pre className="mt-1 p-2 bg-slate-900 text-slate-100 rounded text-[9px] max-w-md overflow-x-auto">
                          {JSON.stringify(log.requestPayload, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
