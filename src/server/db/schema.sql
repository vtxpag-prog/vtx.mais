-- ============================================================================
-- CLUBE VTXMAIS — MÓDULO CENTRAL DE PONTOS FINANCEIROS
-- ESPECIFICAÇÃO DE DDL DO BANCO DE DADOS (MÓDULO 10)
-- Dialeto: PostgreSQL 14+ / ANSI SQL Compatível
-- ============================================================================

-- Habilitar extensão para geração de UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA: pontos_saldos
-- Finalidade: Registro de saldos segregados por usuário com controle otimista
--             de concorrência (saldo_version) e trava de integridade financeira.
-- ============================================================================
CREATE TABLE IF NOT EXISTS pontos_saldos (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('sld_' || uuid_generate_v4()::text),
    usuario_id VARCHAR(64) NOT NULL UNIQUE,
    saldo_disponivel DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    saldo_bloqueado DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    saldo_processamento DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    taxa_desconto_pontos DECIMAL(6, 4) NOT NULL DEFAULT 0.0100,
    saldo_version BIGINT NOT NULL DEFAULT 1,
    aceitou_termos BOOLEAN NOT NULL DEFAULT FALSE,
    termos_aceitos_em TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restrições de Integridade Financeira (Regra de Ouro: Sem saldos negativos)
    CONSTRAINT chk_saldo_disponivel_nao_negativo CHECK (saldo_disponivel >= 0.00),
    CONSTRAINT chk_saldo_bloqueado_nao_negativo CHECK (saldo_bloqueado >= 0.00),
    CONSTRAINT chk_saldo_processamento_nao_negativo CHECK (saldo_processamento >= 0.00),
    CONSTRAINT chk_taxa_desconto_valida CHECK (taxa_desconto_pontos >= 0.0000 AND taxa_desconto_pontos <= 1.0000),
    CONSTRAINT chk_saldo_version_positivo CHECK (saldo_version >= 1),
    CONSTRAINT chk_status_saldo CHECK (status IN ('ativo', 'bloqueado', 'suspenso'))
);

COMMENT ON TABLE pontos_saldos IS 'Tabela que armazena os saldos segregados em tempo real de cada usuário do Clube VTXMais';
COMMENT ON COLUMN pontos_saldos.saldo_disponivel IS 'Saldo livre para resgates, uso em parceiros ou cartão pré-pago';
COMMENT ON COLUMN pontos_saldos.saldo_bloqueado IS 'Saldo temporariamente retido aguardando aprovação de alçada ou liquidação PIX';
COMMENT ON COLUMN pontos_saldos.saldo_processamento IS 'Saldo em trânsito aguardando confirmação externa de gateways bancários';
COMMENT ON COLUMN pontos_saldos.saldo_version IS 'Contador sequencial atômico para controle estrito de concorrência e evitar race conditions';

-- ============================================================================
-- 2. TABELA: pontos_lancamentos
-- Finalidade: LEDGER IMUTÁVEL (Append-Only) para auditoria forense.
--             NUNCA recebe UPDATE ou DELETE. O saldo do usuário é sempre
--             a integral dos lançamentos históricos.
-- ============================================================================
CREATE TABLE IF NOT EXISTS pontos_lancamentos (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('led_' || uuid_generate_v4()::text),
    usuario_id VARCHAR(64) NOT NULL,
    tipo CHAR(1) NOT NULL,
    operacao VARCHAR(50) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    saldo_anterior DECIMAL(15, 2) NOT NULL,
    saldo_posterior DECIMAL(15, 2) NOT NULL,
    versao BIGINT NOT NULL,
    origem VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    correlation_id VARCHAR(100),
    aprovado_por VARCHAR(100),
    descricao TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restrições do Ledger Contábil
    CONSTRAINT chk_tipo_lancamento CHECK (tipo IN ('C', 'D')),
    CONSTRAINT chk_valor_positivo CHECK (valor > 0.00),
    CONSTRAINT chk_saldo_anterior_valido CHECK (saldo_anterior >= 0.00),
    CONSTRAINT chk_saldo_posterior_valido CHECK (saldo_posterior >= 0.00),
    CONSTRAINT chk_operacao_valida CHECK (operacao IN (
        'compra_pix',
        'resgate_pix',
        'uso_parceiro',
        'estorno',
        'cartao_pre_pago',
        'recarga_cartao',
        'ajuste_auditoria',
        'reversao_resgate'
    ))
);

COMMENT ON TABLE pontos_lancamentos IS 'Ledger contábil imutável do módulo de pontos. Proibido qualquer UPDATE ou DELETE';
COMMENT ON COLUMN pontos_lancamentos.tipo IS 'C = Crédito (aumento de saldo), D = Débito (redução de saldo)';
COMMENT ON COLUMN pontos_lancamentos.idempotency_key IS 'Chave de idempotência única enviada pelo cliente/gateway para evitar duplo processamento';
COMMENT ON COLUMN pontos_lancamentos.transaction_id IS 'Identificador universal único da transação financeira';

-- ============================================================================
-- 3. TABELA: pontos_solicitacoes
-- Finalidade: Gestão do ciclo de vida de operações de pontos (Aquisição PIX,
--             Resgate com Saque PIX, Pagamento em Parceiros e Cartão Pré-pago)
--             com matriz de alçadas multinível de aprovação.
-- ============================================================================
CREATE TABLE IF NOT EXISTS pontos_solicitacoes (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('req_' || uuid_generate_v4()::text),
    usuario_id VARCHAR(64) NOT NULL,
    operacao VARCHAR(50) NOT NULL,
    valor_pontos DECIMAL(15, 2) NOT NULL,
    valor_reais DECIMAL(15, 2) NOT NULL,
    taxa_aplicada DECIMAL(6, 4) NOT NULL DEFAULT 0.0100,
    status VARCHAR(40) NOT NULL DEFAULT 'solicitado',
    alcada_necessaria VARCHAR(50) NOT NULL DEFAULT 'automatica',
    aprovacoes_necessarias JSONB NOT NULL DEFAULT '[]'::jsonb,
    aprovacoes_obtidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    chave_pix_destino JSONB,
    dados_pix_compra JSONB,
    parceiro_id VARCHAR(64),
    oferta_id VARCHAR(64),
    cartao_id VARCHAR(64),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP WITH TIME ZONE,

    -- Restrições de Solicitações
    CONSTRAINT chk_operacao_solicitacao CHECK (operacao IN ('compra_pix', 'resgate_pix', 'cartao_pre_pago', 'uso_parceiro')),
    CONSTRAINT chk_valor_pontos_solicitacao CHECK (valor_pontos > 0.00),
    CONSTRAINT chk_valor_reais_solicitacao CHECK (valor_reais >= 0.00),
    CONSTRAINT chk_status_solicitacao CHECK (status IN (
        'pendente_pagamento',
        'solicitado',
        'em_analise_supervisor',
        'em_analise_gerente',
        'em_analise_diretor',
        'aprovado',
        'rejeitado',
        'concluido',
        'expirado',
        'cancelado'
    )),
    CONSTRAINT chk_alcada_solicitacao CHECK (alcada_necessaria IN (
        'automatica',
        'supervisor',
        'supervisor_gerente',
        'supervisor_gerente_diretor'
    ))
);

COMMENT ON TABLE pontos_solicitacoes IS 'Fila de solicitações de movimentação financeira e aprovação hierárquica';

-- ============================================================================
-- 4. TABELAS AUXILIARES DO SISTEMA FINANCEIRO DE PONTOS
-- ============================================================================

-- 4.1 CONTA MÃE DA PLATAFORMA (Entidade Mantenedora / Conciliação Geral)
CREATE TABLE IF NOT EXISTS pontos_conta_mae (
    cnpj VARCHAR(20) PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta_corrente VARCHAR(30) NOT NULL,
    saldo_total_reais DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_cartoes_emitidos DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    diferenca_conciliacao DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status_conciliacao VARCHAR(30) NOT NULL DEFAULT 'conciliado',
    ultima_conciliacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bloqueio_operacoes BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_status_conciliacao CHECK (status_conciliacao IN ('conciliado', 'divergencia'))
);

-- 4.2 CARTÕES PRÉ-PAGOS VIRTUAIS E FÍSICOS
CREATE TABLE IF NOT EXISTS pontos_cartoes (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('card_' || uuid_generate_v4()::text),
    usuario_id VARCHAR(64) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    numero_mascarado VARCHAR(30) NOT NULL,
    titular_nome VARCHAR(150) NOT NULL,
    validade VARCHAR(10) NOT NULL,
    cvv_dinamico VARCHAR(4),
    bandeira VARCHAR(30) NOT NULL DEFAULT 'Mastercard',
    status VARCHAR(30) NOT NULL DEFAULT 'ativo',
    saldo_cartao DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    endereco_entrega JSONB,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_cartao CHECK (tipo IN ('virtual', 'fisico')),
    CONSTRAINT chk_status_cartao CHECK (status IN ('ativo', 'bloqueado', 'em_fabricacao', 'em_transito', 'cancelado')),
    CONSTRAINT chk_saldo_cartao_nao_negativo CHECK (saldo_cartao >= 0.00)
);

-- 4.3 HISTÓRICO DE AUDITORIA DE ALTERAÇÃO DE TAXAS DE DESCONTO
CREATE TABLE IF NOT EXISTS pontos_taxas_historico (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('tax_' || uuid_generate_v4()::text),
    usuario_id VARCHAR(64),
    taxa_anterior DECIMAL(6, 4) NOT NULL,
    taxa_nova DECIMAL(6, 4) NOT NULL,
    alterado_por VARCHAR(64) NOT NULL,
    alterado_por_nome VARCHAR(150) NOT NULL,
    motivo TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4.4 ALERTAS DE RISCO E INCIDENTES DE CONCILIAÇÃO
CREATE TABLE IF NOT EXISTS pontos_alertas_risco (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('risk_' || uuid_generate_v4()::text),
    nivel INT NOT NULL CHECK (nivel BETWEEN 1 AND 5),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    divergencia_valor DECIMAL(15, 2),
    resolvido BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvido_em TIMESTAMP WITH TIME ZONE,
    resolvido_por VARCHAR(150)
);

-- ============================================================================
-- 4.5 FASE 12: VALIDAÇÕES DE CUPONS (POS) & CLEARING HOUSE DE REPASSES B2B
-- ============================================================================

CREATE TABLE IF NOT EXISTS pontos_validacoes_cupons (
    id VARCHAR(64) PRIMARY KEY,
    coupon_code VARCHAR(50) NOT NULL,
    offer_id VARCHAR(64) NOT NULL,
    offer_title VARCHAR(200) NOT NULL,
    partner_id VARCHAR(64) NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(30),
    bill_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    discount_applied DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    net_amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    points_used INT NOT NULL DEFAULT 0,
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validated_by VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'estornado', 'duplicado', 'expirado')),
    payout_status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (payout_status IN ('pendente', 'em_lote', 'liquidado_pix', 'cancelado')),
    settlement_id VARCHAR(64),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS pontos_repasses_parceiros (
    id VARCHAR(64) PRIMARY KEY,
    partner_id VARCHAR(64) NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    partner_cnpj VARCHAR(20) NOT NULL,
    partner_pix_key VARCHAR(150) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_validations INT NOT NULL DEFAULT 0,
    gross_volume_brl DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    discount_volume_brl DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    club_commission_rate DECIMAL(6, 4) NOT NULL DEFAULT 0.1000,
    club_commission_brl DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    points_reimbursement_brl DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    net_payout_brl DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'fechado' CHECK (status IN ('aberto', 'fechado', 'aprovado', 'liquidado_pix', 'cancelado')),
    settled_at TIMESTAMP WITH TIME ZONE,
    settled_by VARCHAR(150),
    pix_transaction_id VARCHAR(100),
    receipt_url VARCHAR(255),
    notes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ÍNDICES DE ALTA PERFORMANCE
-- ============================================================================

-- Índices de pontos_saldos
CREATE INDEX IF NOT EXISTS idx_pontos_saldos_usuario ON pontos_saldos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pontos_saldos_status ON pontos_saldos(status);

-- Índices de pontos_lancamentos
CREATE INDEX IF NOT EXISTS idx_pontos_lancamentos_usuario_data ON pontos_lancamentos(usuario_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pontos_lancamentos_idempotency ON pontos_lancamentos(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pontos_lancamentos_transaction ON pontos_lancamentos(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pontos_lancamentos_operacao ON pontos_lancamentos(operacao);
CREATE INDEX IF NOT EXISTS idx_pontos_lancamentos_criado_em ON pontos_lancamentos(criado_em);

-- Índices de pontos_solicitacoes
CREATE INDEX IF NOT EXISTS idx_pontos_solicitacoes_usuario_status ON pontos_solicitacoes(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_pontos_solicitacoes_status_alcada ON pontos_solicitacoes(status, alcada_necessaria);
CREATE INDEX IF NOT EXISTS idx_pontos_solicitacoes_idempotency ON pontos_solicitacoes(idempotency_key);

-- ============================================================================
-- 6. TRIGGERS DE SEGURANÇA E IMUTABILIDADE
-- ============================================================================

-- Função que impede UPDATE e DELETE no ledger imutável
CREATE OR REPLACE FUNCTION fn_proteger_ledger_imutavel()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLAÇÃO DE COMPLIANCE / AUDITORIA (Módulo 5 & 10): A tabela pontos_lancamentos é estritamente imutável (append-only). Proibido UPDATE ou DELETE.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger ativada no ledger
DROP TRIGGER IF EXISTS trg_proteger_pontos_lancamentos ON pontos_lancamentos;
CREATE TRIGGER trg_proteger_pontos_lancamentos
BEFORE UPDATE OR DELETE ON pontos_lancamentos
FOR EACH ROW
EXECUTE FUNCTION fn_proteger_ledger_imutavel();

-- Função para atualizar coluna atualizado_em
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de timestamp para pontos_saldos
DROP TRIGGER IF EXISTS trg_timestamp_pontos_saldos ON pontos_saldos;
CREATE TRIGGER trg_timestamp_pontos_saldos
BEFORE UPDATE ON pontos_saldos
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_timestamp();

-- Trigger de timestamp para pontos_solicitacoes
DROP TRIGGER IF EXISTS trg_timestamp_pontos_solicitacoes ON pontos_solicitacoes;
CREATE TRIGGER trg_timestamp_pontos_solicitacoes
BEFORE UPDATE ON pontos_solicitacoes
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_timestamp();

-- ============================================================================
-- 7. SEED INICIAL (CARGA BASE COMPATÍVEL COM MANTENEDORA CLUBE VTXMAIS)
-- ============================================================================

INSERT INTO pontos_conta_mae (
    cnpj,
    razao_social,
    banco,
    agencia,
    conta_corrente,
    saldo_total_reais,
    total_cartoes_emitidos,
    diferenca_conciliacao,
    status_conciliacao,
    bloqueio_operacoes
) VALUES (
    '45.123.890/0001-44',
    'VTXMais Benefícios e Tecnologia S.A.',
    '341 - Itaú Unibanco',
    '0001',
    '94820-1',
    154800.00,
    4800.00,
    0.00,
    'conciliado',
    FALSE
) ON CONFLICT (cnpj) DO NOTHING;

-- Seed das carteiras iniciais dos usuários demo
INSERT INTO pontos_saldos (
    usuario_id,
    saldo_disponivel,
    saldo_bloqueado,
    saldo_processamento,
    taxa_desconto_pontos,
    saldo_version,
    aceitou_termos,
    termos_aceitos_em,
    status
) VALUES 
('usr_admin_01', 15400.00, 1200.00, 0.00, 0.0100, 5, TRUE, CURRENT_TIMESTAMP - INTERVAL '30 days', 'ativo'),
('usr_super_02', 8200.00, 2500.00, 0.00, 0.0150, 4, TRUE, CURRENT_TIMESTAMP - INTERVAL '25 days', 'ativo'),
('usr_gerente_03', 12500.00, 0.00, 0.00, 0.0100, 2, TRUE, CURRENT_TIMESTAMP - INTERVAL '20 days', 'ativo'),
('usr_membro_04', 3800.00, 0.00, 0.00, 0.0200, 1, TRUE, CURRENT_TIMESTAMP - INTERVAL '10 days', 'ativo')
ON CONFLICT (usuario_id) DO NOTHING;
