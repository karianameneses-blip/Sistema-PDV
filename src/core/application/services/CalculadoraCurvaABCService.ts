import { ItemCurvaABC, Produto, Venda } from '../../../types';

export class CalculadoraCurvaABCService {
  /**
   * Calcula a classificação ABC dos produtos com base no faturamento de vendas
   */
  public static calcular(produtos: Produto[], vendas: Venda[]): ItemCurvaABC[] {
    const mapaFaturamento = new Map<string, { quantidade: number; faturamento: number }>();

    // Inicializar mapa de produtos
    produtos.forEach((p) => {
      mapaFaturamento.set(p.id, { quantidade: 0, faturamento: 0 });
    });

    // Acumular vendas concluídas
    vendas
      .filter((v) => v.status === 'CONCLUIDA')
      .forEach((venda) => {
        venda.itens.forEach((item) => {
          const acumulado = mapaFaturamento.get(item.produtoId) || { quantidade: 0, faturamento: 0 };
          acumulado.quantidade += item.quantidade;
          acumulado.faturamento += item.subtotal;
          mapaFaturamento.set(item.produtoId, acumulado);
        });
      });

    const faturamentoTotalGeral = Array.from(mapaFaturamento.values()).reduce(
      (sum, item) => sum + item.faturamento,
      0
    );

    // Mapear para lista de itens
    const listaItens: {
      produto: Produto;
      quantidadeVendida: number;
      faturamentoTotal: number;
    }[] = [];

    produtos.forEach((produto) => {
      const dados = mapaFaturamento.get(produto.id) || { quantidade: 0, faturamento: 0 };
      listaItens.push({
        produto,
        quantidadeVendida: dados.quantidade,
        faturamentoTotal: dados.faturamento,
      });
    });

    // Ordenação decrescente por faturamento total
    listaItens.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);

    let acumuladoPercentual = 0;

    return listaItens.map((item) => {
      const percentualFaturamento =
        faturamentoTotalGeral > 0
          ? (item.faturamentoTotal / faturamentoTotalGeral) * 100
          : 0;

      acumuladoPercentual += percentualFaturamento;

      // Curva ABC: A até 80%, B de 80% a 95%, C acima de 95%
      let classificacao: 'A' | 'B' | 'C' = 'C';
      if (faturamentoTotalGeral === 0) {
        classificacao = 'C';
      } else if (acumuladoPercentual <= 80 || item.faturamentoTotal === faturamentoTotalGeral) {
        classificacao = 'A';
      } else if (acumuladoPercentual <= 95) {
        classificacao = 'B';
      } else {
        classificacao = 'C';
      }

      return {
        produtoId: item.produto.id,
        codigoInterno: item.produto.codigoInterno,
        nomeProduto: item.produto.nome,
        quantidadeVendida: item.quantidadeVendida,
        faturamentoTotal: Number(item.faturamentoTotal.toFixed(2)),
        percentualFaturamento: Number(percentualFaturamento.toFixed(1)),
        percentualAcumulado: Number(Math.min(100, acumuladoPercentual).toFixed(1)),
        classificacao,
      };
    });
  }
}
