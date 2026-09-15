/**
 * Exceções de Domínio - Regras de Negócio e Invariantes
 * Arquitetura Limpa / DDD
 */

export abstract class DominioException extends Error {
  public readonly codigo: string;

  constructor(mensagem: string, codigo: string) {
    super(mensagem);
    this.name = this.constructor.name;
    this.codigo = codigo;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SaldoEstoqueInsuficienteException extends DominioException {
  constructor(
    public readonly nomeProduto: string,
    public readonly quantidadeSolicitada: number,
    public readonly estoqueDisponivel: number
  ) {
    super(
      `Estoque insuficiente para "${nomeProduto}". Solicitado: ${quantidadeSolicitada}, Disponível: ${estoqueDisponivel}.`,
      'ESTOQUE_INSUFICIENTE'
    );
  }
}

export class ProdutoNaoEncontradoException extends DominioException {
  constructor(public readonly identificador: string) {
    super(
      `Produto com identificador "${identificador}" não foi encontrado no catálogo.`,
      'PRODUTO_NAO_ENCONTRADO'
    );
  }
}

export class ProdutoInativoException extends DominioException {
  constructor(public readonly nomeProduto: string) {
    super(
      `O produto "${nomeProduto}" está inativo e não pode ser comercializado.`,
      'PRODUTO_INATIVO'
    );
  }
}

export class ItemCarrinhoInvalidoException extends DominioException {
  constructor(mensagem: string) {
    super(mensagem, 'ITEM_CARRINHO_INVALIDO');
  }
}

export class VendaVaziaException extends DominioException {
  constructor() {
    super('Não é permitido finalizar uma venda sem nenhum item no carrinho.', 'VENDA_VAZIA');
  }
}

export class PagamentoInvalidoException extends DominioException {
  constructor(mensagem: string) {
    super(mensagem, 'PAGAMENTO_INVALIDO');
  }
}
