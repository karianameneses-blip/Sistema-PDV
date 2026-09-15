import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCode2,
  Database,
  FolderTree,
  Code2,
  Copy,
  Check,
  ArrowLeft,
  ShieldAlert,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  SaldoEstoqueInsuficienteException,
  PagamentoInvalidoException,
  ProdutoInativoException,
  VendaVaziaException,
} from '../../core/domain/exceptions/DominioExceptions';

export const EspecificacaoArquitetura: React.FC = () => {
  const { setTelaAtiva, usuarioLogado } = useApp();
  const [copiadoSecao, setCopiadoSecao] = useState<string | null>(null);
  const [abaDoc, setAbaDoc] = useState<'SCHEMA_SQL' | 'ARVORE_DIRETORIOS' | 'USE_CASE' | 'PLAYGROUND_EXCECOES'>('SCHEMA_SQL');

  // Teste de Exceções do Domínio
  const [resultadoTeste, setResultadoTeste] = useState<{
    tipo: string;
    mensagem: string;
    codigo: string;
    sucesso: boolean;
  } | null>(null);

  const copiarTexto = (chave: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoSecao(chave);
    setTimeout(() => setCopiadoSecao(null), 2000);
  };

  const testarExcecaoEstoque = () => {
    try {
      throw new SaldoEstoqueInsuficienteException('Arroz Tipo 1 Camil 5kg', 50, 48);
    } catch (err: any) {
      setResultadoTeste({
        tipo: err.name,
        mensagem: err.message,
        codigo: err.codigo,
        sucesso: true,
      });
    }
  };

  const testarExcecaoPagamento = () => {
    try {
      throw new PagamentoInvalidoException(
        'Valor recebido (R$ 20.00) é menor que o total da venda (R$ 29.90). Faltam R$ 9.90.'
      );
    } catch (err: any) {
      setResultadoTeste({
        tipo: err.name,
        mensagem: err.message,
        codigo: err.codigo,
        sucesso: true,
      });
    }
  };

  const testarExcecaoProdutoInativo = () => {
    try {
      throw new ProdutoInativoException('Iogurte Morango Danone 170g');
    } catch (err: any) {
      setResultadoTeste({
        tipo: err.name,
        mensagem: err.message,
        codigo: err.codigo,
        sucesso: true,
      });
    }
  };

  const testarExcecaoVendaVazia = () => {
    try {
      throw new VendaVaziaException();
    } catch (err: any) {
      setResultadoTeste({
        tipo: err.name,
        mensagem: err.message,
        codigo: err.codigo,
        sucesso: true,
      });
    }
  };

  const codigoSchemaSQL = `-- =========================================================================
-- MODELAGEM DE DADOS RELACIONAL: SISTEMA PDV & RETAGUARDA (COMÉRCIO DE BAIRRO)
-- Compatível com: PostgreSQL (Recomendado) e SQLite (com tipos equivalentes)
-- =========================================================================

-- 1. TABELA DE USUÁRIOS (CONTROLE DE ACESSO RBAC)
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

-- 2. TABELA DE PRODUTOS E CONTROLE DE ESTOQUE
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(36) PRIMARY KEY,
    codigo_interno VARCHAR(20) NOT NULL UNIQUE, -- Código digitável no PDV
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(255),
    categoria VARCHAR(60) NOT NULL,
    preco_custo NUMERIC(12, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(12, 2) NOT NULL CHECK (preco_venda >= 0),
    quantidade_estoque NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantidade_estoque >= 0), -- Evita estoque negativo
    estoque_minimo NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN' CHECK (unidade_medida IN ('UN', 'KG', 'L', 'PCT')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
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
    valor_recebido NUMERIC(12, 2),
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
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON itens_venda(produto_id);`;

  const codigoArvoreDiretorios = `sistema-pdv-retaguarda/
├── src/
│   ├── core/                           # NÚCLEO DA CLEAN ARCHITECTURE (Independente de Framework)
│   │   ├── domain/                     # 1. CAMADA DE DOMÍNIO (Regras e Invariantes Centrais)
│   │   │   ├── entities/               # Entidades de Negócio puras
│   │   │   │   ├── Usuario.ts          # Entidade com validação de credenciais e roles
│   │   │   │   ├── Produto.ts          # Entidade com cálculo de margens e regras de estoque
│   │   │   │   ├── LoteValidade.ts     # Entidade com regras de vencimento e cálculo de dias
│   │   │   │   ├── ItemVenda.ts        # Snapshot imutável de itens
│   │   │   │   └── Venda.ts            # Agregado raiz da transação comercial
│   │   │   ├── exceptions/             # Exceções de Domínio Ricas e Customizadas
│   │   │   │   └── DominioExceptions.ts # SaldoEstoqueInsuficiente, PagamentoInvalido, etc.
│   │   │   └── repositories/           # Interfaces de Repositório (DIP - Dependency Inversion)
│   │   │       ├── IProdutoRepository.ts
│   │   │       ├── IVendaRepository.ts
│   │   │       ├── IUsuarioRepository.ts
│   │   │       └── ILoteRepository.ts
│   │   │
│   │   ├── application/                # 2. CAMADA DE APLICAÇÃO (Casos de Uso e Orquestração)
│   │   │   ├── dtos/                   # Objetos de Transferência de Dados (Inputs e Outputs)
│   │   │   │   └── VendaDTOs.ts        # FecharVendaEntradaDTO e FecharVendaSaidaDTO
│   │   │   ├── services/               # Serviços de Aplicação Específicos
│   │   │   │   ├── GeradorCupomNaoFiscalService.ts # Formatação 58mm / 80mm
│   │   │   │   └── CalculadoraCurvaABCService.ts    # Algoritmo de Pareto (A=80%, B=15%, C=5%)
│   │   │   └── use-cases/              # Casos de Uso (Cada arquivo faz uma única coisa - SRP)
│   │   │       └── FecharVendaUseCase.ts # Baixa no estoque + Fechamento da venda
│   │   │
│   │   └── infrastructure/             # 3. CAMADA DE INFRAESTRUTURA (Adapters externos e DB)
│   │       ├── database/
│   │       │   ├── schema.sql          # Modelagem DDL PostgreSQL / SQLite
│   │       │   └── InitialData.ts      # Carga de dados (Mercadinho de Bairro)
│   │       └── repositories/           # Implementações Concretas dos Repositórios
│   │           ├── PostgresProdutoRepository.ts (ou LocalStorageProdutoRepository.ts)
│   │           ├── PostgresVendaRepository.ts
│   │           ├── PostgresUsuarioRepository.ts
│   │           └── PostgresLoteRepository.ts
│   │
│   ├── presentation/ (ou components/)  # 4. CAMADA DE APRESENTAÇÃO (Interface do Usuário)
│   │   ├── pdv/                        # Módulo Frente de Caixa (Operador)
│   │   │   ├── FrenteCaixa.tsx         # Digitação rápida, busca dinâmica e atalhos F10/F3
│   │   │   ├── ModalPagamento.tsx      # Dinheiro (troco automático), Pix e Cartão
│   │   │   └── VisualizadorCupom.tsx   # Cupom Não Fiscal para impressoras 58mm e 80mm
│   │   ├── retaguarda/                 # Módulo Administrativo (Gerente)
│   │   │   ├── DashboardAdmin.tsx      # Visão geral de KPIs e faturamento
│   │   │   ├── GestaoEstoque.tsx       # Cadastro, edição e alertas de estoque mínimo
│   │   │   ├── ControleValidade.tsx    # Lotes e alertas visuais de vencimento
│   │   │   ├── RelatoriosGerenciais.tsx# Faturamento diário/mensal e Curva ABC
│   │   │   └── GestaoUsuarios.tsx      # Controle de acessos e alteração de senhas
│   │   └── auth/
│   │       └── TelaLogin.tsx           # Autenticação com redirecionamento por Role
│   │
│   ├── context/
│   │   └── AppContext.tsx              # Provedor de Injeção de Dependência e Estado
│   ├── types.ts                        # Tipagens globais do TypeScript
│   ├── App.tsx                         # Roteamento e orquestrador visual
│   └── main.tsx                        # Ponto de entrada da aplicação
└── package.json`;

  const codigoUseCase = `import {
  FecharVendaEntradaDTO,
  FecharVendaSaidaDTO,
  ItemEntradaDTO,
} from '../dtos/VendaDTOs';
import { IProdutoRepository, IVendaRepository } from '../../domain/repositories/IRepositories';
import {
  ItemCarrinhoInvalidoException,
  PagamentoInvalidoException,
  ProdutoInativoException,
  ProdutoNaoEncontradoException,
  SaldoEstoqueInsuficienteException,
  VendaVaziaException,
} from '../../domain/exceptions/DominioExceptions';
import { ItemVenda, Venda } from '../../../types';
import { GeradorCupomNaoFiscalService } from '../services/GeradorCupomNaoFiscalService';

/**
 * CASO DE USO: FecharVendaUseCase
 *
 * Princípios SOLID aplicados:
 * 1. SRP (Single Responsibility): Responsável estritamente pelo fluxo de fechamento da venda.
 * 2. DIP (Dependency Inversion): Depende de contratos de repositório (IProdutoRepository, IVendaRepository).
 * 3. OCP (Open-Closed): Formatos de cupom e formas de pagamento podem ser expandidos sem quebrar o caso de uso.
 */
export class FecharVendaUseCase {
  constructor(
    private readonly produtoRepository: IProdutoRepository,
    private readonly vendaRepository: IVendaRepository
  ) {}

  public async executar(entrada: FecharVendaEntradaDTO): Promise<FecharVendaSaidaDTO> {
    // 1. Validação de Invariantes Iniciais (Clean Code - Fail Fast)
    this.validarEntradaVenda(entrada);

    // 2. Consulta e Validação dos Produtos e Estoque Atual
    const { itensProcessados, subtotalTotal } = await this.validarEPrepararItens(entrada.itens);

    // 3. Aplicação de Desconto e Valor Líquido
    const desconto = entrada.desconto && entrada.desconto > 0 ? entrada.desconto : 0;
    const valorFinal = Math.max(0, subtotalTotal - desconto);

    // 4. Validação de Pagamento e Troco
    const troco = this.calcularEValidarPagamento(
      entrada.formaPagamento,
      valorFinal,
      entrada.valorRecebido
    );

    // 5. Baixa Atômica no Estoque (Transacional)
    await this.darBaixaNoEstoque(entrada.itens);

    // 6. Geração e Persistência do Agregado Venda
    const proximoNumeroCupom = (await this.vendaRepository.obterUltimoNumeroCupom()) + 1;

    const novaVenda: Venda = {
      id: crypto.randomUUID ? crypto.randomUUID() : \`venda_\${Date.now()}\`,
      numeroCupom: proximoNumeroCupom,
      dataHora: new Date().toISOString(),
      operadorId: entrada.operadorId,
      operadorNome: entrada.operadorNome,
      itens: itensProcessados,
      valorTotal: subtotalTotal,
      desconto,
      valorFinal,
      formaPagamento: entrada.formaPagamento,
      valorRecebido: entrada.valorRecebido,
      troco,
      status: 'CONCLUIDA',
    };

    await this.vendaRepository.salvar(novaVenda);

    // 7. Geração do Cupom Não Fiscal Estruturado
    const cupom58mm = GeradorCupomNaoFiscalService.gerarCupom58mm(novaVenda);
    const cupom80mm = GeradorCupomNaoFiscalService.gerarCupom80mm(novaVenda);

    return {
      sucesso: true,
      venda: novaVenda,
      troco,
      cupomNaoFiscal58mm: cupom58mm,
      cupomNaoFiscal80mm: cupom80mm,
    };
  }

  private validarEntradaVenda(entrada: FecharVendaEntradaDTO): void {
    if (!entrada.itens || entrada.itens.length === 0) {
      throw new VendaVaziaException();
    }
  }

  private async validarEPrepararItens(
    itensEntrada: ItemEntradaDTO[]
  ): Promise<{ itensProcessados: ItemVenda[]; subtotalTotal: number }> {
    const itensProcessados: ItemVenda[] = [];
    let subtotalTotal = 0;

    for (const item of itensEntrada) {
      if (item.quantidade <= 0) {
        throw new ItemCarrinhoInvalidoException(
          \`A quantidade para o item deve ser maior que zero (recebido: \${item.quantidade}).\`
        );
      }

      const produto = await this.produtoRepository.buscarPorId(item.produtoId);

      if (!produto) {
        throw new ProdutoNaoEncontradoException(item.produtoId);
      }

      if (!produto.ativo) {
        throw new ProdutoInativoException(produto.nome);
      }

      // Regra de Negócio: Não vender acima do estoque físico disponível
      if (produto.quantidadeEstoque < item.quantidade) {
        throw new SaldoEstoqueInsuficienteException(
          produto.nome,
          item.quantidade,
          produto.quantidadeEstoque
        );
      }

      const subtotalItem = Number((produto.precoVenda * item.quantidade).toFixed(2));
      subtotalTotal += subtotalItem;

      itensProcessados.push({
        id: crypto.randomUUID ? crypto.randomUUID() : \`item_\${Date.now()}_\${Math.random()}\`,
        produtoId: produto.id,
        codigoInterno: produto.codigoInterno,
        nomeProduto: produto.nome,
        quantidade: item.quantidade,
        valorUnitario: produto.precoVenda,
        subtotal: subtotalItem,
      });
    }

    return {
      itensProcessados,
      subtotalTotal: Number(subtotalTotal.toFixed(2)),
    };
  }

  private calcularEValidarPagamento(
    formaPagamento: string,
    valorFinal: number,
    valorRecebido?: number
  ): number {
    if (formaPagamento === 'DINHEIRO') {
      const recebido = valorRecebido ?? 0;
      if (recebido < valorFinal) {
        const falta = (valorFinal - recebido).toFixed(2);
        throw new PagamentoInvalidoException(
          \`Valor recebido (R$ \${recebido.toFixed(2)}) é menor que o total da venda (R$ \${valorFinal.toFixed(2)}). Faltam R$ \${falta}.\`
        );
      }
      return Number((recebido - valorFinal).toFixed(2));
    }
    return 0;
  }

  private async darBaixaNoEstoque(itens: ItemEntradaDTO[]): Promise<void> {
    await this.produtoRepository.deduzirEstoqueTransacional(itens);
  }
}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTelaAtiva(usuarioLogado?.papel === 'ADMINISTRADOR' ? 'DASHBOARD' : 'PDV')}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Sistema</span>
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-blue-600" />
              Documentação de Arquitetura & Código-Fonte
            </h1>
            <p className="text-xs text-slate-500">
              Clean Architecture, SOLID, Modelagem SQL e Caso de Uso FecharVenda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTelaAtiva('PDV')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Testar Caixa (PDV)
          </button>
        </div>
      </header>

      {/* Navegação entre os 4 Entregáveis */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <nav className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setAbaDoc('SCHEMA_SQL')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              abaDoc === 'SCHEMA_SQL'
                ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>1. Modelagem de Dados (Schema SQL)</span>
          </button>

          <button
            onClick={() => setAbaDoc('ARVORE_DIRETORIOS')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              abaDoc === 'ARVORE_DIRETORIOS'
                ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <FolderTree className="w-4 h-4 text-blue-600" />
            <span>2. Árvore de Diretórios (Clean Architecture)</span>
          </button>

          <button
            onClick={() => setAbaDoc('USE_CASE')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              abaDoc === 'USE_CASE'
                ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-600" />
            <span>3. Caso de Uso (FecharVendaUseCase & Clean Code)</span>
          </button>

          <button
            onClick={() => setAbaDoc('PLAYGROUND_EXCECOES')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              abaDoc === 'PLAYGROUND_EXCECOES'
                ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Playground de Exceções de Domínio</span>
          </button>
        </nav>
      </div>

      {/* Conteúdo */}
      <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto space-y-4">
        {/* ABA 1: SCHEMA SQL */}
        {abaDoc === 'SCHEMA_SQL' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Modelagem Relacional Otimizada (PostgreSQL / SQLite)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inclui constraints de verificação (CHECK estoque &gt;= 0), integridade referencial,
                  índices para busca textual rápida de caixa e procedure de baixa atômica.
                </p>
              </div>

              <button
                onClick={() => copiarTexto('sql', codigoSchemaSQL)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-xs"
              >
                {copiadoSecao === 'sql' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <pre className="p-5 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
                {codigoSchemaSQL}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 2: ÁRVORE DE DIRETÓRIOS */}
        {abaDoc === 'ARVORE_DIRETORIOS' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  Estrutura de Pastas com Clean Architecture & DDD
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Separação estrita em camadas concêntricas: Domínio (Regras), Aplicação (Casos de Uso),
                  Infraestrutura (DB/APIs) e Apresentação (UI).
                </p>
              </div>

              <button
                onClick={() => copiarTexto('arvore', codigoArvoreDiretorios)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-xs"
              >
                {copiadoSecao === 'arvore' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Estrutura</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <pre className="p-5 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
                {codigoArvoreDiretorios}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 3: CASO DE USO FECHAR VENDA */}
        {abaDoc === 'USE_CASE' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-600" />
                  Código-Fonte do Caso de Uso: FecharVendaUseCase.ts
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Implementação em TypeScript aplicando Single Responsibility (SRP), Inversão de Dependência (DIP),
                  tratamento rigoroso de saldo de estoque e emissão síncrona do cupom térmico.
                </p>
              </div>

              <button
                onClick={() => copiarTexto('usecase', codigoUseCase)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-xs"
              >
                {copiadoSecao === 'usecase' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <pre className="p-5 font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
                {codigoUseCase}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 4: PLAYGROUND INTERATIVO DE EXCEÇÕES */}
        {abaDoc === 'PLAYGROUND_EXCECOES' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Playground de Exceções de Domínio (Clean Code & Business Invariants)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Conforme solicitado na especificação, o sistema possui classes de exceção especializadas e expressivas.
                Clique nos botões abaixo para disparar e inspecionar a resposta estruturada de cada exceção de negócio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={testarExcecaoEstoque}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-1">
                  <span>Estoque Insuficiente</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Dispara SaldoEstoqueInsuficienteException
                </p>
              </button>

              <button
                onClick={testarExcecaoPagamento}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 mb-1">
                  <span>Pagamento Inválido</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Dispara PagamentoInvalidoException
                </p>
              </button>

              <button
                onClick={testarExcecaoProdutoInativo}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-1">
                  <span>Produto Inativo</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Dispara ProdutoInativoException
                </p>
              </button>

              <button
                onClick={testarExcecaoVendaVazia}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-600 mb-1">
                  <span>Venda sem Itens</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Dispara VendaVaziaException
                </p>
              </button>
            </div>

            {/* Resultado do Teste */}
            {resultadoTeste && (
              <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-md animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Exceção Capturada pelo Handler de Domínio</span>
                  </div>
                  <span className="font-mono text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-bold">
                    Código: {resultadoTeste.codigo}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Classe da Exceção:</span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {resultadoTeste.tipo}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Mensagem Amigável:</span>
                    <span className="text-sm font-medium text-slate-700">
                      "{resultadoTeste.mensagem}"
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
