import React, { useState } from 'react';
import { CRMHealthReport } from '../../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Server,
  Zap,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CrmWebhookHealthCardProps {
  report: CRMHealthReport | null;
  onRefresh: () => Promise<void> | void;
  loading?: boolean;
}

export const CrmWebhookHealthCard: React.FC<CrmWebhookHealthCardProps> = ({
  report,
  onRefresh,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = () => {
    if (!report) {
      return {
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
        dotColor: 'bg-slate-400',
        label: 'Aguardando Verificação',
        title: 'Verificando status...',
        icon: HelpCircle,
        textColor: 'text-slate-700',
      };
    }

    switch (report.state) {
      case 'healthy':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-500 animate-pulse',
          label: 'Saudável (200 OK)',
          title: 'Conexão Operacional',
          icon: CheckCircle2,
          textColor: 'text-emerald-700',
        };
      case 'degraded':
        return {
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500',
          label: `Degradado (HTTP ${report.statusCode || 'Erro'})`,
          title: 'Resposta Não Esperada',
          icon: AlertTriangle,
          textColor: 'text-amber-700',
        };
      case 'unreachable':
        return {
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
          dotColor: 'bg-rose-500',
          label: 'Inalcançável / Timeout',
          title: 'Servidor Não Responde',
          icon: XCircle,
          textColor: 'text-rose-700',
        };
      case 'not_configured':
      default:
        return {
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
          dotColor: 'bg-slate-400',
          label: 'Não Configurado (.env)',
          title: 'Webhook Ausente',
          icon: AlertTriangle,
          textColor: 'text-slate-700',
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  const getLatencyQuality = (ms: number) => {
    if (ms <= 0) return { label: 'Indisponível', color: 'text-slate-400' };
    if (ms < 150) return { label: 'Excelente', color: 'text-emerald-600 font-bold' };
    if (ms < 400) return { label: 'Boa', color: 'text-blue-600 font-bold' };
    if (ms < 1000) return { label: 'Moderada', color: 'text-amber-600 font-bold' };
    return { label: 'Lenta', color: 'text-rose-600 font-bold' };
  };

  const latencyInfo = report ? getLatencyQuality(report.latencyMs) : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/25 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-heading">
                Monitor de Saúde do Webhook CRM
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/20">
                .env
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Validação de conectividade, tempo de resposta e integridade da URL do webhook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => onRefresh()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition cursor-pointer shadow-xs"
            title="Executar novo teste de ping e conectividade"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Validando...' : 'Testar Conexão Agora'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Top Status & Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Status Geral */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Status Operacional
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${status.dotColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className={`w-4 h-4 ${status.textColor}`} />
                <span className="text-sm font-bold text-slate-900">{status.title}</span>
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.badgeBg}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Latência */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Latência de Resposta
              </span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-heading">
                {report ? `${report.latencyMs} ms` : '—'}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span>Classificação:</span>
                {latencyInfo && <span className={latencyInfo.color}>{latencyInfo.label}</span>}
              </div>
            </div>
          </div>

          {/* Origem da Configuração */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Origem da URL
              </span>
              <Server className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {report?.envVarDefined ? 'Variável .env Ativa' : 'Padrão / Banco'}
              </div>
              <div className="text-xs text-slate-500">
                {report?.isHttps ? '🔒 Protocolo Seguro (HTTPS)' : '⚠️ Protocolo HTTP / Local'}
              </div>
            </div>
          </div>

          {/* Autenticação e Segurança */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Credencial / Token
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {report?.authHeaderConfigured ? 'Bearer Token Ativo' : 'Sem Autenticação'}
              </div>
              <div className="text-[11px] text-slate-500">
                {report?.authHeaderConfigured ? 'Cabeçalho Authorization enviado' : 'Chave opcional no CRM'}
              </div>
            </div>
          </div>

        </div>

        {/* URL Display Box */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Endpoint Monitorado:</span>
              {report?.envVarDefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  CRM_WEBHOOK_URL
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(report?.webhookUrl || '')}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                title="Copiar URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>
          <div className="font-mono text-xs sm:text-sm text-blue-300 break-all bg-black/40 p-2.5 rounded-xl border border-white/5">
            {report?.webhookUrl || 'Nenhuma URL definida em .env'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {report?.message || 'Aguardando diagnóstico...'}
          </p>
        </div>

        {/* Checklist de Validação Detalhado */}
        {report && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Critérios de Verificação Técnica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">1. Variável CRM_WEBHOOK_URL declarada em .env</span>
                {report.checks.envDefined ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Válida
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Não Encontrada
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">2. Estrutura de URL válida (HTTP/HTTPS)</span>
                {report.checks.validUrlFormat ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Sintaxe Correta
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <XCircle className="w-4 h-4" /> Sintaxe Inválida
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">3. Handshake & Conectividade do Servidor</span>
                {report.checks.serverReachable ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Conectado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <XCircle className="w-4 h-4" /> Falha de Rede
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">4. Desempenho de Latência (&lt; 1000ms)</span>
                {report.checks.acceptableLatency ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> {report.latencyMs}ms
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <AlertTriangle className="w-4 h-4" /> {report.latencyMs}ms (Lento)
                  </span>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Payload / Snippet Expansível */}
        {report?.samplePayload && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Visualizar Carga Útil (Payload JSON) do Teste de Conexão</span>
              </div>
              {showPayload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPayload && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto space-y-3">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Payload Enviado:</span>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed">
                    {JSON.stringify(report.samplePayload, null, 2)}
                  </pre>
                </div>
                {report.responseSnippet && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Resposta do Endpoint:</span>
                    <pre className="text-blue-300 text-[11px] leading-relaxed">
                      {report.responseSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Timestamp */}
        {report?.testedAt && (
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última validação: {new Date(report.testedAt).toLocaleString('pt-BR')}
            </span>
            <span>Monitoramento Automático de Webhook VTXMais</span>
          </div>
        )}

      </div>
    </div>
  );
};
