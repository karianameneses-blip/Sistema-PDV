import { Venda } from '../../../types';

/**
 * Serviço de aplicação responsável por formatar a venda em texto puro
 * monoespaçado, otimizado para bobinas térmicas de 58mm (32 colunas) e 80mm (48 colunas).
 */
export class GeradorCupomNaoFiscalService {
  private static readonly NOME_ESTABELECIMENTO = 'MERCADINHO DO BAIRRO';
  private static readonly SUBTITULO = 'Comércio de Alimentos e Variedades';
  private static readonly ENDERECO = 'Rua do Comércio, 120 - Centro';
  private static readonly CNPJ_FICTICIO = 'CNPJ: 12.345.678/0001-90';

  /**
   * Gera o cupom para 58mm (padrão de 32 colunas)
   */
  public static gerarCupom58mm(venda: Venda): string {
    const LARGURA = 32;
    const divisor = '-'.repeat(LARGURA);
    const duploDivisor = '='.repeat(LARGURA);

    const linhas: string[] = [];

    // Cabeçalho
    linhas.push(this.centralizar(this.NOME_ESTABELECIMENTO, LARGURA));
    linhas.push(this.centralizar(this.SUBTITULO, LARGURA));
    linhas.push(this.centralizar(this.ENDERECO, LARGURA));
    linhas.push(this.centralizar(this.CNPJ_FICTICIO, LARGURA));
    linhas.push(duploDivisor);
    linhas.push(this.centralizar('*** CUPOM NAO FISCAL ***', LARGURA));
    linhas.push(duploDivisor);

    // Metadados
    const dataFormatada = new Date(venda.dataHora).toLocaleString('pt-BR');
    linhas.push(`DOC: #${String(venda.numeroCupom).padStart(6, '0')}  ${dataFormatada}`);
    linhas.push(`OP: ${venda.operadorNome.slice(0, 24)}`);
    linhas.push(divisor);

    // Itens
    linhas.push('ITEM COD DESC');
    linhas.push('QTD x VL.UNIT             TOTAL');
    linhas.push(divisor);

    venda.itens.forEach((item, index) => {
      const numItem = String(index + 1).padStart(2, '0');
      const nomeTruncado = item.nomeProduto.slice(0, 24).toUpperCase();
      linhas.push(`${numItem} [${item.codigoInterno}] ${nomeTruncado}`);

      const qtdEUnit = `${item.quantidade}x R$ ${item.valorUnitario.toFixed(2)}`;
      const totalItem = `R$ ${item.subtotal.toFixed(2)}`;
      linhas.push(this.alinharExtremos(qtdEUnit, totalItem, LARGURA));
    });

    linhas.push(divisor);

    // Totais e Pagamento
    const totalItens = `TOTAL ITENS: ${venda.itens.reduce((acc, i) => acc + i.quantidade, 0)}`;
    linhas.push(totalItens);

    linhas.push(this.alinharExtremos('SUBTOTAL:', `R$ ${venda.valorTotal.toFixed(2)}`, LARGURA));
    if (venda.desconto > 0) {
      linhas.push(this.alinharExtremos('DESCONTO:', `- R$ ${venda.desconto.toFixed(2)}`, LARGURA));
    }
    linhas.push(this.alinharExtremos('TOTAL A PAGAR:', `R$ ${venda.valorFinal.toFixed(2)}`, LARGURA));
    linhas.push(divisor);

    linhas.push(this.alinharExtremos('FORMA PAGTO:', this.formatarFormaPagamento(venda.formaPagamento), LARGURA));
    if (venda.valorRecebido && venda.valorRecebido > 0) {
      linhas.push(this.alinharExtremos('VALOR RECEBIDO:', `R$ ${venda.valorRecebido.toFixed(2)}`, LARGURA));
    }
    if (venda.troco !== undefined && venda.troco > 0) {
      linhas.push(this.alinharExtremos('TROCO:', `R$ ${venda.troco.toFixed(2)}`, LARGURA));
    }

    linhas.push(duploDivisor);
    linhas.push(this.centralizar('VOLTE SEMPRE!', LARGURA));
    linhas.push(this.centralizar('SEM VALOR FISCAL', LARGURA));
    linhas.push(duploDivisor);

    return linhas.join('\n');
  }

  /**
   * Gera o cupom para 80mm (padrão de 48 colunas)
   */
  public static gerarCupom80mm(venda: Venda): string {
    const LARGURA = 48;
    const divisor = '-'.repeat(LARGURA);
    const duploDivisor = '='.repeat(LARGURA);

    const linhas: string[] = [];

    // Cabeçalho
    linhas.push(this.centralizar(this.NOME_ESTABELECIMENTO, LARGURA));
    linhas.push(this.centralizar(this.SUBTITULO, LARGURA));
    linhas.push(this.centralizar(this.ENDERECO, LARGURA));
    linhas.push(this.centralizar(this.CNPJ_FICTICIO, LARGURA));
    linhas.push(duploDivisor);
    linhas.push(this.centralizar('*** COMPROVANTE NÃO FISCAL DE VENDA ***', LARGURA));
    linhas.push(duploDivisor);

    // Metadados
    const dataFormatada = new Date(venda.dataHora).toLocaleString('pt-BR');
    linhas.push(this.alinharExtremos(`CUPOM Nº: #${String(venda.numeroCupom).padStart(6, '0')}`, dataFormatada, LARGURA));
    linhas.push(`OPERADOR DE CAIXA: ${venda.operadorNome}`);
    linhas.push(divisor);

    // Itens em tabela
    linhas.push('ITEM CÓDIGO  DESCRIÇÃO            QTD  UNITÁRIO    TOTAL');
    linhas.push(divisor);

    venda.itens.forEach((item, index) => {
      const num = String(index + 1).padStart(3, ' ');
      const cod = item.codigoInterno.padEnd(7, ' ');
      const desc = item.nomeProduto.slice(0, 18).padEnd(18, ' ');
      const qtd = String(item.quantidade).padStart(4, ' ');
      const unit = item.valorUnitario.toFixed(2).padStart(9, ' ');
      const sub = item.subtotal.toFixed(2).padStart(8, ' ');
      linhas.push(`${num} ${cod} ${desc} ${qtd} ${unit} ${sub}`);
    });

    linhas.push(divisor);

    linhas.push(this.alinharExtremos('QUANTIDADE TOTAL DE ITENS:', String(venda.itens.reduce((acc, i) => acc + i.quantidade, 0)), LARGURA));
    linhas.push(this.alinharExtremos('SUBTOTAL DOS PRODUTOS:', `R$ ${venda.valorTotal.toFixed(2)}`, LARGURA));
    if (venda.desconto > 0) {
      linhas.push(this.alinharExtremos('DESCONTO CONCEDIDO:', `- R$ ${venda.desconto.toFixed(2)}`, LARGURA));
    }
    linhas.push(this.alinharExtremos('VALOR TOTAL LÍQUIDO:', `R$ ${venda.valorFinal.toFixed(2)}`, LARGURA));
    linhas.push(divisor);

    linhas.push(this.alinharExtremos('FORMA DE PAGAMENTO:', this.formatarFormaPagamento(venda.formaPagamento), LARGURA));
    if (venda.valorRecebido) {
      linhas.push(this.alinharExtremos('VALOR RECEBIDO EM DINHEIRO:', `R$ ${venda.valorRecebido.toFixed(2)}`, LARGURA));
    }
    if (venda.troco !== undefined && venda.troco > 0) {
      linhas.push(this.alinharExtremos('TROCO DO CLIENTE:', `R$ ${venda.troco.toFixed(2)}`, LARGURA));
    }

    linhas.push(duploDivisor);
    linhas.push(this.centralizar('OBRIGADO PELA PREFERÊNCIA! VOLTE SEMPRE!', LARGURA));
    linhas.push(this.centralizar('ESTE DOCUMENTO NÃO POSSUI VALIDADE FISCAL', LARGURA));
    linhas.push(duploDivisor);

    return linhas.join('\n');
  }

  private static centralizar(texto: string, largura: number): string {
    if (texto.length >= largura) return texto.slice(0, largura);
    const espacos = Math.floor((largura - texto.length) / 2);
    return ' '.repeat(espacos) + texto;
  }

  private static alinharExtremos(esquerda: string, direita: string, largura: number): string {
    const espacos = Math.max(1, largura - esquerda.length - direita.length);
    return esquerda + ' '.repeat(espacos) + direita;
  }

  private static formatarFormaPagamento(forma: string): string {
    const mapa: Record<string, string> = {
      DINHEIRO: 'DINHEIRO',
      CARTAO_CREDITO: 'CARTÃO CRÉDITO',
      CARTAO_DEBITO: 'CARTÃO DÉBITO',
      PIX: 'PIX INSTANTÂNEO',
    };
    return mapa[forma] || forma;
  }
}
