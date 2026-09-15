import { FormaPagamento, ItemVenda, Venda } from '../../../types';

export interface ItemEntradaDTO {
  produtoId: string;
  quantidade: number;
}

export interface FecharVendaEntradaDTO {
  operadorId: string;
  operadorNome: string;
  itens: ItemEntradaDTO[];
  formaPagamento: FormaPagamento;
  valorRecebido?: number;
  desconto?: number;
}

export interface FecharVendaSaidaDTO {
  sucesso: boolean;
  venda: Venda;
  troco: number;
  cupomNaoFiscal58mm: string;
  cupomNaoFiscal80mm: string;
}
