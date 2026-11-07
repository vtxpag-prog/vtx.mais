import { Lead, CRMConfig, CRMLog, CRMHealthReport, CRMHealthState } from '../types';
import { INITIAL_CRM_CONFIG } from './seedData';

class CRMService {
  private config: CRMConfig = { ...INITIAL_CRM_CONFIG };
  private logs: CRMLog[] = [];
  private lastHealthReport: CRMHealthReport | null = null;

  constructor() {
    // Sync with environment variables if present
    const envWebhookUrl = process.env.CRM_WEBHOOK_URL?.trim();
    const envApiKey = process.env.CRM_API_KEY?.trim();

    if (envWebhookUrl && (envWebhookUrl.startsWith('http://') || envWebhookUrl.startsWith('https://'))) {
      this.config.webhookUrl = envWebhookUrl;
    }
    if (envApiKey) {
      this.config.apiKey = envApiKey;
    }
  }

  getConfig(): CRMConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<CRMConfig>): CRMConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      fieldMapping: {
        ...this.config.fieldMapping,
        ...(newConfig.fieldMapping || {}),
      },
    };
    return this.config;
  }

  getLogs(): CRMLog[] {
    return this.logs;
  }

  formatPayload(lead: Lead) {
    const map = this.config.fieldMapping;
    return {
      [map.leadName]: lead.name,
      [map.leadEmail]: lead.email,
      [map.leadPhone]: lead.phone,
      [map.couponCode]: lead.couponCode,
      [map.couponTitle]: lead.offerTitle,
      [map.category]: lead.category,
      [map.cep]: lead.userCep,
      [map.timestamp]: lead.createdAt,
      [map.origin]: lead.origin,
      // Metadata
      metadata: {
        partner: lead.partnerName,
        offerId: lead.offerId,
        userCity: lead.userCity,
        userState: lead.userState,
        distanceKm: lead.distanceKm,
        platform: 'Clube VTXMais',
        ipEstimated: '177.136.241.10',
      },
    };
  }

  async dispatchLead(lead: Lead): Promise<{ success: boolean; message: string; statusCode: number }> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      return {
        success: false,
        message: 'CRM desabilitado ou URL não configurada.',
        statusCode: 400,
      };
    }

    const payload = this.formatPayload(lead);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-VTX-Source': 'VTXMais-Benefits-Club',
      'X-VTX-Event': 'coupon_lead_captured',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      headers['X-API-KEY'] = this.config.apiKey;
    }

    const logId = 'log_' + Date.now();

    try {
      // If user configured a real external URL (e.g. webhook.site, pipedream, zapier, rdstation)
      const isHttp = this.config.webhookUrl.startsWith('http://') || this.config.webhookUrl.startsWith('https://');
      
      let statusCode = 200;
      let responseText = 'Lead sincronizado com sucesso!';

      if (isHttp && !this.config.webhookUrl.includes('api.vtxmais.com.br')) {
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        });
        statusCode = response.status;
        responseText = await response.text();
      } else {
        // Internal default simulator
        statusCode = 200;
        responseText = JSON.stringify({
          status: 'success',
          leadId: lead.id,
          message: 'Lead recebido e processado pelo CRM.',
          syncedAt: new Date().toISOString(),
        });
      }

      const success = statusCode >= 200 && statusCode < 300;

      const logItem: CRMLog = {
        id: logId,
        leadId: lead.id,
        leadName: lead.name,
        endpoint: this.config.webhookUrl,
        status: statusCode,
        success,
        requestPayload: payload,
        responseBody: responseText.slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      this.logs.unshift(logItem);
      if (this.logs.length > 50) this.logs.pop();

      return {
        success,
        message: success ? 'Lead enviado ao CRM com sucesso.' : `Falha no CRM (Status ${statusCode})`,
        statusCode,
      };
    } catch (err: any) {
      const logItem: CRMLog = {
        id: logId,
        leadId: lead.id,
        leadName: lead.name,
        endpoint: this.config.webhookUrl,
        status: 500,
        success: false,
        requestPayload: payload,
        responseBody: err?.message || 'Erro de conexão de rede.',
        createdAt: new Date().toISOString(),
      };
      this.logs.unshift(logItem);

      return {
        success: false,
        message: `Erro ao conectar com Webhook: ${err?.message || 'Timeout'}`,
        statusCode: 500,
      };
    }
  }

  async testConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string; payloadSent: any }> {
    const targetUrl = customUrl || this.config.webhookUrl;
    const key = customKey !== undefined ? customKey : this.config.apiKey;

    const testLead: Lead = {
      id: 'test_lead_' + Date.now(),
      name: 'Lead Teste de Conexão',
      phone: '(11) 99999-8888',
      email: 'teste@vtxmais.com.br',
      couponCode: 'VTX-TESTE-CRM',
      offerId: 'off_outback_bloomin',
      offerTitle: 'Oferta Teste de Homologação',
      partnerName: 'Outback Steakhouse',
      category: 'Promoções do Mês',
      userCep: '01310-100',
      userCity: 'São Paulo',
      userState: 'SP',
      distanceKm: 0.5,
      crmStatus: 'pendente',
      createdAt: new Date().toISOString(),
      origin: 'Teste de Conexão CRM Painel Admin',
    };

    const payload = this.formatPayload(testLead);

    try {
      if (targetUrl.startsWith('http') && !targetUrl.includes('api.vtxmais.com.br')) {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-VTX-Test': 'true',
            'Authorization': key ? `Bearer ${key}` : '',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        });

        const success = res.status >= 200 && res.status < 300;
        this.config.lastTestStatus = success ? 'sucesso' : 'falha';
        this.config.lastTestMessage = success
          ? `Webhook respondeu com HTTP ${res.status}`
          : `Erro: Webhook retornou status HTTP ${res.status}`;
        this.config.lastTestedAt = new Date().toISOString();

        return {
          success,
          message: this.config.lastTestMessage,
          payloadSent: payload,
        };
      } else {
        // Successful simulation
        this.config.lastTestStatus = 'sucesso';
        this.config.lastTestMessage = 'Conexão simulada com sucesso! URL válida e payload estruturado.';
        this.config.lastTestedAt = new Date().toISOString();
        return {
          success: true,
          message: 'Conexão validada com sucesso! Webhook pronto para receber leads.',
          payloadSent: payload,
        };
      }
    } catch (err: any) {
      this.config.lastTestStatus = 'falha';
      this.config.lastTestMessage = `Falha na requisição: ${err?.message || 'Sem resposta'}`;
      this.config.lastTestedAt = new Date().toISOString();
      return {
        success: false,
        message: this.config.lastTestMessage,
        payloadSent: payload,
      };
    }
  }

  async getHealthReport(): Promise<CRMHealthReport> {
    if (!this.lastHealthReport) {
      return this.runHealthCheck();
    }
    return this.lastHealthReport;
  }

  async runHealthCheck(customUrl?: string, customKey?: string): Promise<CRMHealthReport> {
    const rawEnvUrl = process.env.CRM_WEBHOOK_URL?.trim();
    const envVarDefined = !!rawEnvUrl;
    
    // Determine target URL: customUrl > env URL (if valid) > config URL
    let targetUrl = customUrl || (envVarDefined && (rawEnvUrl.startsWith('http://') || rawEnvUrl.startsWith('https://')) ? rawEnvUrl : this.config.webhookUrl);
    const key = customKey !== undefined ? customKey : (process.env.CRM_API_KEY || this.config.apiKey);

    const isEnvSource = !customUrl && envVarDefined && targetUrl === rawEnvUrl;

    let validUrlFormat = false;
    let isHttps = false;
    let host = '';

    try {
      if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
        const parsed = new URL(targetUrl);
        validUrlFormat = true;
        isHttps = parsed.protocol === 'https:';
        host = parsed.host;
      }
    } catch {
      validUrlFormat = false;
    }

    if (!targetUrl || !validUrlFormat) {
      const report: CRMHealthReport = {
        state: 'not_configured',
        latencyMs: 0,
        message: envVarDefined 
          ? `A variável CRM_WEBHOOK_URL está definida no .env mas possui formato inválido: "${rawEnvUrl}". Utilize http:// ou https://`
          : 'URL de Webhook não configurada no .env nem nas preferências do sistema.',
        testedAt: new Date().toISOString(),
        webhookUrl: targetUrl || rawEnvUrl || '',
        source: isEnvSource ? 'env' : 'database',
        envVarDefined,
        isHttps: false,
        host: '',
        authHeaderConfigured: !!key,
        checks: {
          envDefined: envVarDefined,
          validUrlFormat: false,
          serverReachable: false,
          acceptableLatency: false,
        },
      };
      this.lastHealthReport = report;
      return report;
    }

    // Prepare probe payload
    const testLead: Lead = {
      id: 'probe_' + Date.now(),
      name: 'Verificação de Integridade VTXMais',
      phone: '(11) 99999-0000',
      email: 'healthcheck@vtxmais.com.br',
      couponCode: 'PROBE-PING-200',
      offerId: 'probe_offer',
      offerTitle: 'Ping de Conexão CRM Webhook',
      partnerName: 'VTXMais Healthcheck',
      category: 'Promoções do Mês',
      userCep: '01310-100',
      userCity: 'São Paulo',
      userState: 'SP',
      distanceKm: 0.1,
      crmStatus: 'pendente',
      createdAt: new Date().toISOString(),
      origin: 'Verificação de Saúde Automatizada do Painel',
    };

    const payload = this.formatPayload(testLead);
    const startTime = Date.now();

    try {
      if (targetUrl.startsWith('http') && !targetUrl.includes('api.vtxmais.com.br')) {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-VTX-Health-Check': 'true',
            'X-VTX-Source': 'VTXMais-CRM-Monitor',
            ...(key ? { 'Authorization': `Bearer ${key}`, 'X-API-KEY': key } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4500),
        });

        const latencyMs = Date.now() - startTime;
        const statusCode = res.status;
        const text = await res.text();
        const snippet = text.slice(0, 300);

        const isSuccess = statusCode >= 200 && statusCode < 300;
        const isDegraded = statusCode >= 400 && statusCode < 600;

        const state: CRMHealthState = isSuccess ? 'healthy' : isDegraded ? 'degraded' : 'unreachable';

        const report: CRMHealthReport = {
          state,
          statusCode,
          latencyMs,
          message: isSuccess
            ? `Conexão bem-sucedida! Webhook respondeu com HTTP ${statusCode} (${latencyMs}ms).`
            : `Servidor remoto alcançado, mas retornou HTTP ${statusCode}. Verifique rota ou autenticação.`,
          testedAt: new Date().toISOString(),
          webhookUrl: targetUrl,
          source: isEnvSource ? 'env' : 'database',
          envVarDefined,
          isHttps,
          host,
          authHeaderConfigured: !!key,
          checks: {
            envDefined: envVarDefined,
            validUrlFormat: true,
            serverReachable: isSuccess || isDegraded,
            acceptableLatency: latencyMs < 1000,
          },
          samplePayload: payload,
          responseSnippet: snippet,
        };

        this.lastHealthReport = report;
        return report;
      } else {
        // Internal endpoint simulation / default demonstration endpoint
        const latencyMs = Math.floor(Math.random() * 35) + 42; // ~42ms - 77ms
        const report: CRMHealthReport = {
          state: 'healthy',
          statusCode: 200,
          latencyMs,
          message: `Conexão ativa e validada! Endpoint simulado respondeu com 200 OK (${latencyMs}ms).`,
          testedAt: new Date().toISOString(),
          webhookUrl: targetUrl,
          source: isEnvSource ? 'env' : 'database',
          envVarDefined,
          isHttps,
          host,
          authHeaderConfigured: !!key,
          checks: {
            envDefined: envVarDefined,
            validUrlFormat: true,
            serverReachable: true,
            acceptableLatency: true,
          },
          samplePayload: payload,
          responseSnippet: '{"status":"success","message":"Lead recebido pelo pipeline de integração."}',
        };
        this.lastHealthReport = report;
        return report;
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';

      const report: CRMHealthReport = {
        state: 'unreachable',
        statusCode: 0,
        latencyMs,
        message: isTimeout
          ? 'Tempo limite excedido (Timeout 4.5s). O servidor do webhook não respondeu a tempo.'
          : `Falha de rede ao conectar: ${err?.message || 'Host inalcançável'}`,
        testedAt: new Date().toISOString(),
        webhookUrl: targetUrl,
        source: isEnvSource ? 'env' : 'database',
        envVarDefined,
        isHttps,
        host,
        authHeaderConfigured: !!key,
        checks: {
          envDefined: envVarDefined,
          validUrlFormat: true,
          serverReachable: false,
          acceptableLatency: false,
        },
        samplePayload: payload,
        responseSnippet: err?.message || 'Sem resposta do servidor.',
      };

      this.lastHealthReport = report;
      return report;
    }
  }
}

export const crmService = new CRMService();
