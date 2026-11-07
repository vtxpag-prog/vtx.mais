import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  description: string;
  constraints?: string[];
}

export interface TableDefinition {
  name: string;
  description: string;
  primaryKey: string;
  immutable?: boolean;
  columns: ColumnDefinition[];
  indexes: string[];
  triggers: string[];
}

export interface DatabaseSchemaInfo {
  engine: string;
  dialect: string;
  version: string;
  tables: TableDefinition[];
  triggersCount: number;
  indexesCount: number;
  rawSql: string;
}

export const POINTS_DATABASE_TABLES: TableDefinition[] = [
  {
    name: 'pontos_saldos',
    description: 'Armazena saldos segregados em tempo real de cada associado do Clube VTXMais com controle otimista de versão (concorrência).',
    primaryKey: 'id',
    columns: [
      {
        name: 'id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: true,
        defaultValue: "sld_ + UUID",
        description: 'Identificador único do registro de saldo',
      },
      {
        name: 'usuario_id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: false,
        isUnique: true,
        description: 'Chave do usuário associado (herdado do Clube VTXMais)',
      },
      {
        name: 'saldo_disponivel',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Saldo livre disponível para compras e resgates',
        constraints: ['CHECK (saldo_disponivel >= 0.00)'],
      },
      {
        name: 'saldo_bloqueado',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Saldo retido em solicitações de saque PIX ou cartão pendente de aprovação',
        constraints: ['CHECK (saldo_bloqueado >= 0.00)'],
      },
      {
        name: 'saldo_processamento',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Saldo aguardando confirmação externa de gateways bancários',
        constraints: ['CHECK (saldo_processamento >= 0.00)'],
      },
      {
        name: 'taxa_desconto_pontos',
        type: 'DECIMAL(6,4)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.0100 (1%)',
        description: 'Paridade de desconto individual por associado',
        constraints: ['CHECK (taxa_desconto_pontos BETWEEN 0.0000 AND 1.0000)'],
      },
      {
        name: 'saldo_version',
        type: 'BIGINT',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '1',
        description: 'Contador de controle de concorrência atômico (incrementado a cada transação)',
        constraints: ['CHECK (saldo_version >= 1)'],
      },
      {
        name: 'aceitou_termos',
        type: 'BOOLEAN',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'FALSE',
        description: 'Indica se associado aceitou os Termos de Uso da Carteira de Pontos',
      },
      {
        name: 'termos_aceitos_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Data e hora do consentimento formal dos termos',
      },
      {
        name: 'status',
        type: 'VARCHAR(30)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'ativo'",
        description: 'Situação cadastral da carteira de pontos',
        constraints: ["CHECK (status IN ('ativo', 'bloqueado', 'suspenso'))"],
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Timestamp de criação do registro',
      },
      {
        name: 'atualizado_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Timestamp da última mutação de saldo',
      },
    ],
    indexes: ['idx_pontos_saldos_usuario (usuario_id)', 'idx_pontos_saldos_status (status)'],
    triggers: ['trg_timestamp_pontos_saldos (BEFORE UPDATE -> fn_atualizar_timestamp)'],
  },
  {
    name: 'pontos_lancamentos',
    description: 'Ledger Contábil Imutável (Append-Only) do Clube VTXMais. Armazena a trilha auditável de todas as movimentações financeiras. Operações de UPDATE ou DELETE são terminantemente bloqueadas.',
    primaryKey: 'id',
    immutable: true,
    columns: [
      {
        name: 'id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: true,
        defaultValue: "led_ + UUID",
        description: 'Identificador único imutável do lançamento no ledger',
      },
      {
        name: 'usuario_id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Identificador do associado titular',
      },
      {
        name: 'tipo',
        type: 'CHAR(1)',
        isNullable: false,
        isPrimaryKey: false,
        description: "Sentido contábil: 'C' para Crédito (+), 'D' para Débito (-)",
        constraints: ["CHECK (tipo IN ('C', 'D'))"],
      },
      {
        name: 'operacao',
        type: 'VARCHAR(50)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Tipo de operação de negócio',
        constraints: ["CHECK (operacao IN ('compra_pix', 'resgate_pix', 'uso_parceiro', 'estorno', 'cartao_pre_pago', 'recarga_cartao', 'ajuste_auditoria', 'reversao_resgate'))"],
      },
      {
        name: 'valor',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Valor pontual da operação contábil (sempre positivo)',
        constraints: ['CHECK (valor > 0.00)'],
      },
      {
        name: 'saldo_anterior',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Saldo do associado antes do lançamento',
        constraints: ['CHECK (saldo_anterior >= 0.00)'],
      },
      {
        name: 'saldo_posterior',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Saldo apurado imediatamente após o lançamento',
        constraints: ['CHECK (saldo_posterior >= 0.00)'],
      },
      {
        name: 'versao',
        type: 'BIGINT',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Versão do saldo associada no momento do lançamento',
      },
      {
        name: 'origem',
        type: 'VARCHAR(150)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Entidade ou conta originária do recurso',
      },
      {
        name: 'destino',
        type: 'VARCHAR(150)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Entidade ou conta destinatária do recurso',
      },
      {
        name: 'idempotency_key',
        type: 'VARCHAR(100)',
        isNullable: false,
        isPrimaryKey: false,
        isUnique: true,
        description: 'Chave exclusiva de idempotência para blindagem contra duplo clique ou reprocessamento',
      },
      {
        name: 'transaction_id',
        type: 'VARCHAR(100)',
        isNullable: false,
        isPrimaryKey: false,
        isUnique: true,
        description: 'Identificador global de rastreamento transacional',
      },
      {
        name: 'correlation_id',
        type: 'VARCHAR(100)',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Identificador de correlação em fluxos assíncronos e webhooks',
      },
      {
        name: 'aprovado_por',
        type: 'VARCHAR(100)',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Identificador do responsável/alçada que autorizou a liberação',
      },
      {
        name: 'descricao',
        type: 'TEXT',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Histórico textual descritivo detalhado da operação',
      },
      {
        name: 'metadata',
        type: 'JSONB',
        isNullable: true,
        isPrimaryKey: false,
        defaultValue: "'{}'::jsonb",
        description: 'Metadados complementares (payloads, vouchers, auditoria)',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Carimbo de data/hora do lançamento',
      },
    ],
    indexes: [
      'idx_pontos_lancamentos_usuario_data (usuario_id, criado_em DESC)',
      'idx_pontos_lancamentos_idempotency (idempotency_key UNIQUE)',
      'idx_pontos_lancamentos_transaction (transaction_id UNIQUE)',
      'idx_pontos_lancamentos_operacao (operacao)',
      'idx_pontos_lancamentos_criado_em (criado_em)',
    ],
    triggers: ['trg_proteger_pontos_lancamentos (BEFORE UPDATE OR DELETE -> RAISE EXCEPTION compliance)'],
  },
  {
    name: 'pontos_solicitacoes',
    description: 'Fila transacional de solicitações com governança de aprovação multinível de alçadas (PIX Automático, Supervisor, Gerente, Diretor), emissão de cartões e liquidações.',
    primaryKey: 'id',
    columns: [
      {
        name: 'id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: true,
        defaultValue: "req_ + UUID",
        description: 'Identificador único da solicitação',
      },
      {
        name: 'usuario_id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Identificador do associado solicitante',
      },
      {
        name: 'operacao',
        type: 'VARCHAR(50)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Operação solicitada (compra_pix, resgate_pix, cartao_pre_pago, uso_parceiro)',
        constraints: ["CHECK (operacao IN ('compra_pix', 'resgate_pix', 'cartao_pre_pago', 'uso_parceiro'))"],
      },
      {
        name: 'valor_pontos',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Quantidade de pontos transacionada',
        constraints: ['CHECK (valor_pontos > 0.00)'],
      },
      {
        name: 'valor_reais',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Valor financeiro em moeda corrente (R$)',
        constraints: ['CHECK (valor_reais >= 0.00)'],
      },
      {
        name: 'taxa_aplicada',
        type: 'DECIMAL(6,4)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.0100',
        description: 'Taxa percentual contratada na operação',
      },
      {
        name: 'status',
        type: 'VARCHAR(40)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'solicitado'",
        description: 'Status atual no fluxo de aprovação e liquidação',
        constraints: ["CHECK (status IN ('pendente_pagamento', 'solicitado', 'em_analise_supervisor', 'em_analise_gerente', 'em_analise_diretor', 'aprovado', 'rejeitado', 'concluido', 'expirado', 'cancelado'))"],
      },
      {
        name: 'alcada_necessaria',
        type: 'VARCHAR(50)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'automatica'",
        description: 'Nível de aprovação exigido pelas regras de compliance',
        constraints: ["CHECK (alcada_necessaria IN ('automatica', 'supervisor', 'supervisor_gerente', 'supervisor_gerente_diretor'))"],
      },
      {
        name: 'aprovacoes_necessarias',
        type: 'JSONB',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'[]'::jsonb",
        description: 'Lista ordenada de papéis exigidos para aprovação',
      },
      {
        name: 'aprovacoes_obtidas',
        type: 'JSONB',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'[]'::jsonb",
        description: 'Histórico de decisões registradas pelos aprovadores',
      },
      {
        name: 'chave_pix_destino',
        type: 'JSONB',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Dados da chave PIX de destino (em caso de saque financeiro)',
      },
      {
        name: 'dados_pix_compra',
        type: 'JSONB',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Payload PIX Copia e Cola / QR Code para recebimento',
      },
      {
        name: 'parceiro_id',
        type: 'VARCHAR(64)',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Parceiro afiliado conveniado na operação de uso',
      },
      {
        name: 'oferta_id',
        type: 'VARCHAR(64)',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Oferta vinculada à compra',
      },
      {
        name: 'cartao_id',
        type: 'VARCHAR(64)',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Cartão gerado ou recarregado',
      },
      {
        name: 'idempotency_key',
        type: 'VARCHAR(100)',
        isNullable: false,
        isPrimaryKey: false,
        isUnique: true,
        description: 'Garantia de unicidade para evitar dupla criação',
      },
      {
        name: 'transaction_id',
        type: 'VARCHAR(100)',
        isNullable: false,
        isPrimaryKey: false,
        isUnique: true,
        description: 'ID da transação',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Data de solicitação',
      },
      {
        name: 'atualizado_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Data da última alteração de status',
      },
      {
        name: 'expira_em',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: true,
        isPrimaryKey: false,
        description: 'Data de expiração automática da solicitação (ex: 48h para PIX)',
      },
    ],
    indexes: [
      'idx_pontos_solicitacoes_usuario_status (usuario_id, status)',
      'idx_pontos_solicitacoes_status_alcada (status, alcada_necessaria)',
      'idx_pontos_solicitacoes_idempotency (idempotency_key UNIQUE)',
    ],
    triggers: ['trg_timestamp_pontos_solicitacoes (BEFORE UPDATE -> fn_atualizar_timestamp)'],
  },
  {
    name: 'pontos_conta_mae',
    description: 'Registro central da Conta Mãe da mantenedora oficial (VTXMais Tecnologia S.A.). Ponto único de conciliação matemática universal.',
    primaryKey: 'cnpj',
    columns: [
      {
        name: 'cnpj',
        type: 'VARCHAR(20)',
        isNullable: false,
        isPrimaryKey: true,
        description: 'CNPJ da entidade mantenedora gestora da plataforma',
      },
      {
        name: 'razao_social',
        type: 'VARCHAR(200)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Razão social oficial da mantenedora',
      },
      {
        name: 'banco',
        type: 'VARCHAR(100)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Instituição financeira detentora da conta de custódia',
      },
      {
        name: 'agencia',
        type: 'VARCHAR(20)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Agência bancária',
      },
      {
        name: 'conta_corrente',
        type: 'VARCHAR(30)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Número da conta corrente',
      },
      {
        name: 'saldo_total_reais',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Saldo financeiro total depositado em custódia bancária',
      },
      {
        name: 'total_cartoes_emitidos',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Saldo total alocado para cartões pré-pagos emitidos',
      },
      {
        name: 'diferenca_conciliacao',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Divergência entre o saldo bancário e a soma contábil das carteiras',
      },
      {
        name: 'status_conciliacao',
        type: 'VARCHAR(30)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'conciliado'",
        description: 'Estado da conciliação (conciliado ou divergencia)',
      },
      {
        name: 'bloqueio_operacoes',
        type: 'BOOLEAN',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'FALSE',
        description: 'Bloqueio preventivo ativado em caso de divergência ou auditoria',
      },
      {
        name: 'ultima_conciliacao',
        type: 'TIMESTAMP WITH TIME ZONE',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Data e hora da última validação matemática de conciliação',
      },
    ],
    indexes: ['PRIMARY KEY (cnpj)'],
    triggers: [],
  },
  {
    name: 'pontos_validacoes_cupons',
    description:
      'Registro operacional de cupons e vouchers validados no terminal de atendimento (POS) dos parceiros afiliados (Fase 12)',
    primaryKey: 'id',
    columns: [
      {
        name: 'id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: true,
        description: 'Identificador único da validação',
      },
      {
        name: 'coupon_code',
        type: 'VARCHAR(50)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Código do cupom apresentado no balcão',
      },
      {
        name: 'partner_id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'ID do parceiro comercial',
      },
      {
        name: 'bill_amount',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Valor total bruto consumido pelo cliente na loja',
      },
      {
        name: 'discount_applied',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Desconto total concedido na mesa/caixa',
      },
      {
        name: 'net_amount_paid',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Valor líquido efetivamente pago pelo cliente',
      },
      {
        name: 'validated_by',
        type: 'VARCHAR(150)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Nome do operador ou atendente que realizou o check-in',
      },
      {
        name: 'status',
        type: 'VARCHAR(30)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'confirmado'",
        description: 'Status da validação: confirmado, estornado ou duplicado',
      },
    ],
    indexes: ['PRIMARY KEY (id)', 'INDEX (coupon_code)', 'INDEX (partner_id)'],
    triggers: [],
  },
  {
    name: 'pontos_repasses_parceiros',
    description:
      'Lotes de fechamento financeiro e clearing house devidos aos estabelecimentos parceiros (Fase 12)',
    primaryKey: 'id',
    columns: [
      {
        name: 'id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: true,
        description: 'ID da fatura de repasse (ex: SET-OUTBACK-202610-01)',
      },
      {
        name: 'partner_id',
        type: 'VARCHAR(64)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'ID do estabelecimento parceiro',
      },
      {
        name: 'partner_pix_key',
        type: 'VARCHAR(150)',
        isNullable: false,
        isPrimaryKey: false,
        description: 'Chave PIX bancária para liquidação do repasse',
      },
      {
        name: 'gross_volume_brl',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Volume bruto total transacionado na loja pelo clube',
      },
      {
        name: 'club_commission_brl',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Comissão de intermediação retida pelo Clube VTXMais',
      },
      {
        name: 'net_payout_brl',
        type: 'DECIMAL(15,2)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: '0.00',
        description: 'Valor líquido transferido ao parceiro via PIX',
      },
      {
        name: 'status',
        type: 'VARCHAR(30)',
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "'fechado'",
        description: 'Status: aberto, fechado, aprovado ou liquidado_pix',
      },
    ],
    indexes: ['PRIMARY KEY (id)', 'INDEX (partner_id)', 'INDEX (status)'],
    triggers: [],
  },
];

export function getDatabaseSchemaMetadata(): DatabaseSchemaInfo {
  let rawSql = '';
  try {
    const sqlPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(sqlPath)) {
      rawSql = fs.readFileSync(sqlPath, 'utf-8');
    }
  } catch {}

  const triggersCount = POINTS_DATABASE_TABLES.reduce(
    (acc, t) => acc + t.triggers.length,
    0
  );
  const indexesCount = POINTS_DATABASE_TABLES.reduce(
    (acc, t) => acc + t.indexes.length,
    0
  );

  return {
    engine: 'Relational ACID Financial Ledger',
    dialect: 'PostgreSQL 14+ / ANSI SQL',
    version: '10.1.0 - Módulo 10 Compliance',
    tables: POINTS_DATABASE_TABLES,
    triggersCount,
    indexesCount,
    rawSql,
  };
}
