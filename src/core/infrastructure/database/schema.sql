-- =========================================================================
-- MODELAGEM DE DADOS RELACIONAL: SISTEMA PDV & RETAGUARDA (COMÉRCIO DE BAIRRO)
-- Compatível com: PostgreSQL (Recomendado) e SQLite (com tipos equivalentes)
-- Padrões: Nomenclatura descritiva, constraints de integridade e índices de performance
-- =========================================================================

-- 1. TABELA DE USUÁRIOS E CONTROLE DE ACESSO (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('ADMINISTRADOR', 'OPERADOR_CAIXA')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);

-- 2. TABELA DE PRODUTOS E ESTOQUE
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(36) PRIMARY KEY,
    codigo_interno VARCHAR(20) NOT NULL UNIQUE, -- Código digitável rápido no PDV
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(255),
    categoria VARCHAR(60) NOT NULL,
    preco_custo NUMERIC(12, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(12, 2) NOT NULL CHECK (preco_venda >= 0),
    quantidade_estoque NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantidade_estoque >= 0), -- Evita estoque negativo por constraint
    estoque_minimo NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN' CHECK (unidade_medida IN ('UN', 'KG', 'L', 'PCT')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices otimizados para a digitação e busca textual rápida do operador de caixa
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo ON produtos(quantidade_estoque, estoque_minimo);

-- 3. TABELA DE LOTES E CONTROLE DE VALIDADE
CREATE TABLE IF NOT EXISTS lotes_validade (
    id VARCHAR(36) PRIMARY KEY,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    numero_lote VARCHAR(50) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    quantidade NUMERIC(12, 3) NOT NULL CHECK (quantidade >= 0),
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_lotes_data_validade ON lotes_validade(data_validade);
CREATE INDEX IF NOT EXISTS idx_lotes_produto_id ON lotes_validade(produto_id);

-- 4. TABELA DE VENDAS (CABEÇALHO DA OPERAÇÃO DE CAIXA)
CREATE TABLE IF NOT EXISTS vendas (
    id VARCHAR(36) PRIMARY KEY,
    numero_cupom BIGSERIAL UNIQUE, -- Sequencial contínuo para o cupom não fiscal
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operador_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    valor_total NUMERIC(12, 2) NOT NULL CHECK (valor_total >= 0),
    desconto NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (desconto >= 0),
    valor_final NUMERIC(12, 2) NOT NULL CHECK (valor_final >= 0),
    forma_pagamento VARCHAR(20) NOT NULL CHECK (forma_pagamento IN ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX')),
    valor_recebido NUMERIC(12, 2), -- Informado quando em dinheiro
    troco NUMERIC(12, 2) DEFAULT 0.00 CHECK (troco >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA' CHECK (status IN ('CONCLUIDA', 'CANCELADA'))
);

CREATE INDEX IF NOT EXISTS idx_vendas_data_hora ON vendas(data_hora);
CREATE INDEX IF NOT EXISTS idx_vendas_operador ON vendas(operador_id);
CREATE INDEX IF NOT EXISTS idx_vendas_numero_cupom ON vendas(numero_cupom);

-- 5. TABELA DE ITENS DA VENDA (SNAPSHOT IMUTÁVEL DE VALORES)
CREATE TABLE IF NOT EXISTS itens_venda (
    id VARCHAR(36) PRIMARY KEY,
    venda_id VARCHAR(36) NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade NUMERIC(12, 3) NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(12, 2) NOT NULL CHECK (valor_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON itens_venda(produto_id);

-- =========================================================================
-- ROTINA DE BAIXA DE ESTOQUE TRANSACIONAL ATÔMICA (Exemplo com PL/pgSQL)
-- Garante isolamento estrito contra condições de corrida (Race Conditions)
-- =========================================================================
/*
CREATE OR REPLACE PROCEDURE sp_baixar_estoque_transacional(
    p_produto_id VARCHAR(36),
    p_quantidade NUMERIC(12, 3)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estoque_atual NUMERIC(12, 3);
BEGIN
    -- Bloqueio pessimista da linha do produto (FOR UPDATE)
    SELECT quantidade_estoque INTO v_estoque_atual
    FROM produtos
    WHERE id = p_produto_id AND ativo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto % não cadastrado ou inativo.', p_produto_id;
    END IF;

    IF v_estoque_atual < p_quantidade THEN
        RAISE EXCEPTION 'Saldo de estoque insuficiente. Disponível: %, Solicitado: %', v_estoque_atual, p_quantidade;
    END IF;

    UPDATE produtos
    SET quantidade_estoque = quantidade_estoque - p_quantidade,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = p_produto_id;
END;
$$;
*/
