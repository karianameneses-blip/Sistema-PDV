export type PapelUsuario = 'ADMINISTRADOR' | 'OPERADOR_CAIXA';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  senhaHash?: string;
  papel: PapelUsuario;
  ativo: boolean;
  criadoEm: string;
}

export interface Produto {
  id: string;
  codigoInterno: string;
  nome: string;
  descricao?: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  unidadeMedida: 'UN' | 'KG' | 'L' | 'PCT';
  ativo: boolean;
  atualizadoEm: string;
}

export interface LoteValidade {
  id: string;
  produtoId: string;
  produtoNome?: string;
  numeroLote: string;
  dataFabricacao?: string;
  dataValidade: string;
  quantidade: number;
  dataEntrada: string;
}

export interface ItemVenda {
  id: string;
  produtoId: string;
  codigoInterno: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export interface Venda {
  id: string;
  numeroCupom: number;
  dataHora: string;
  operadorId: string;
  operadorNome: string;
  itens: ItemVenda[];
  valorTotal: number;
  desconto: number;
  valorFinal: number;
  formaPagamento: FormaPagamento;
  valorRecebido?: number;
  troco?: number;
  status: 'CONCLUIDA' | 'CANCELADA';
}

export interface ItemCurvaABC {
  produtoId: string;
  codigoInterno: string;
  nomeProduto: string;
  quantidadeVendida: number;
  faturamentoTotal: number;
  percentualFaturamento: number;
  percentualAcumulado: number;
  classificacao: 'A' | 'B' | 'C';
}
