import {
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
import { ItemVenda, Produto, Venda } from '../../../types';
import { GeradorCupomNaoFiscalService } from '../services/GeradorCupomNaoFiscalService';

/**
 * Caso de Uso: Fechar Venda e Dar Baixa no Estoque
 *
 * Responsabilidade Única (SRP): Orquestrar o fechamento da venda, garantindo a
 * integridade do saldo de estoque, a conferência do pagamento e a emissão do cupom não fiscal.
 *
 * Princípio da Inversão de Dependência (DIP): Depende de abstrações (interfaces de repositório),
 * permitindo plugar PostgreSQL, SQLite ou persistência local sem alterar a lógica de negócios.
 */
export class FecharVendaUseCase {
  constructor(
    private readonly produtoRepository: IProdutoRepository,
    private readonly vendaRepository: IVendaRepository
  ) {}

  public async executar(entrada: FecharVendaEntradaDTO): Promise<FecharVendaSaidaDTO> {
    // 1. Validação de Invariantes Iniciais
    this.validarEntradaVenda(entrada);

    // 2. Consulta e Validação dos Produtos e Estoque Atual
    const { itensProcessados, subtotalTotal } = await this.validarEPrepararItens(entrada.itens);

    // 3. Cálculo de Desconto e Valor Final
    const desconto = entrada.desconto && entrada.desconto > 0 ? entrada.desconto : 0;
    const valorFinal = Math.max(0, subtotalTotal - desconto);

    // 4. Validação de Pagamento e Cálculo de Troco
    const troco = this.calcularEValidarPagamento(
      entrada.formaPagamento,
      valorFinal,
      entrada.valorRecebido
    );

    // 5. Baixa Atômica no Estoque (Transacional)
    await this.darBaixaNoEstoque(entrada.itens);

    // 6. Criação e Persistência da Entidade Venda
    const proximoNumeroCupom = (await this.vendaRepository.obterUltimoNumeroCupom()) + 1;

    const novaVenda: Venda = {
      id: crypto.randomUUID ? crypto.randomUUID() : `venda_${Date.now()}`,
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

    // 7. Geração do Cupom Não Fiscal para Impressão Térmica
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

  /**
   * Garante que a venda tenha itens válidos antes de iniciar o processamento
   */
  private validarEntradaVenda(entrada: FecharVendaEntradaDTO): void {
    if (!entrada.itens || entrada.itens.length === 0) {
      throw new VendaVaziaException();
    }
  }

  /**
   * Carrega os produtos do repositório, valida estoque e prepara snapshot de preços
   */
  private async validarEPrepararItens(
    itensEntrada: ItemEntradaDTO[]
  ): Promise<{ itensProcessados: ItemVenda[]; subtotalTotal: number }> {
    const itensProcessados: ItemVenda[] = [];
    let subtotalTotal = 0;

    for (const item of itensEntrada) {
      if (item.quantidade <= 0) {
        throw new ItemCarrinhoInvalidoException(
          `A quantidade para o item deve ser maior que zero (recebido: ${item.quantidade}).`
        );
      }

      const produto = await this.produtoRepository.buscarPorId(item.produtoId);

      if (!produto) {
        throw new ProdutoNaoEncontradoException(item.produtoId);
      }

      if (!produto.ativo) {
        throw new ProdutoInativoException(produto.nome);
      }

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
        id: crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`,
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

  /**
   * Valida a forma de pagamento e calcula o troco para pagamento em espécie
   */
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
          `Valor recebido (R$ ${recebido.toFixed(2)}) é menor que o total da venda (R$ ${valorFinal.toFixed(2)}). Faltam R$ ${falta}.`
        );
      }
      return Number((recebido - valorFinal).toFixed(2));
    }

    // Para Cartão de Crédito/Débito e Pix, o valor liquidado é exato
    return 0;
  }

  /**
   * Efetua a baixa atômica no banco de dados
   */
  private async darBaixaNoEstoque(itens: ItemEntradaDTO[]): Promise<void> {
    await this.produtoRepository.deduzirEstoqueTransacional(itens);
  }
}
