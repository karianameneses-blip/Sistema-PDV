import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FormaPagamento } from '../../types';
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  X,
  AlertCircle,
  Percent,
} from 'lucide-react';

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export const ModalPagamento: React.FC<Props> = ({ aberto, onFechar }) => {
  const { totalCarrinho, finalizarVenda, processandoVenda } = useApp();

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('DINHEIRO');
  const [valorRecebidoStr, setValorRecebidoStr] = useState<string>('');
  const [descontoStr, setDescontoStr] = useState<string>('0');
  const [erro, setErro] = useState<string | null>(null);

  // Resetar valores ao abrir
  useEffect(() => {
    if (aberto) {
      setFormaPagamento('DINHEIRO');
      setValorRecebidoStr(totalCarrinho > 0 ? totalCarrinho.toFixed(2) : '');
      setDescontoStr('0');
      setErro(null);
    }
  }, [aberto, totalCarrinho]);

  if (!aberto) return null;

  const desconto = parseFloat(descontoStr.replace(',', '.')) || 0;
  const valorFinal = Math.max(0, totalCarrinho - desconto);
  const valorRecebido = parseFloat(valorRecebidoStr.replace(',', '.')) || 0;
  const troco = Math.max(0, valorRecebido - valorFinal);
  const falta = Math.max(0, valorFinal - valorRecebido);

  const handleConfirmarVenda = async () => {
    setErro(null);

    if (formaPagamento === 'DINHEIRO' && valorRecebido < valorFinal) {
      setErro(`Valor recebido insuficiente. Faltam R$ ${falta.toFixed(2)}.`);
      return;
    }

    const res = await finalizarVenda(
      formaPagamento,
      formaPagamento === 'DINHEIRO' ? valorRecebido : valorFinal,
      desconto
    );

    if (res.sucesso) {
      onFechar();
    } else {
      setErro(res.erro || 'Falha ao processar venda.');
    }
  };

  const aplicarValorRapido = (adicional: number) => {
    const atual = parseFloat(valorRecebidoStr.replace(',', '.')) || valorFinal;
    const novo = Math.ceil(atual + adicional);
    setValorRecebidoStr(novo.toFixed(2));
  };

  const preencherValorExato = () => {
    setValorRecebidoStr(valorFinal.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in selection:bg-blue-500/20">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              TERMINAL PDV • LIQUIDAÇÃO [F10]
            </span>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">FECHAMENTO DA TRANSAÇÃO</h2>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo de Valores - Estilo Display de Caixa Corporativo */}
        <div className="p-5 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2 text-xs text-slate-600">
            <span className="uppercase tracking-wider font-semibold">Subtotal Itens:</span>
            <span className="font-bold text-slate-900 text-sm font-mono">R$ {totalCarrinho.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-600 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" /> Desconto Concedido (R$):
            </span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={descontoStr}
              onChange={(e) => setDescontoStr(e.target.value)}
              className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded text-right text-xs text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">TOTAL LÍQUIDO A PAGAR:</span>
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">
              R$ {valorFinal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Seleção da Forma de Pagamento */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              SELECIONE O MEIO DE PAGAMENTO
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormaPagamento('DINHEIRO')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  formaPagamento === 'DINHEIRO'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento('PIX')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  formaPagamento === 'PIX'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento('CARTAO_DEBITO')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  formaPagamento === 'CARTAO_DEBITO'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento('CARTAO_CREDITO')}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  formaPagamento === 'CARTAO_CREDITO'
                    ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Crédito</span>
              </button>
            </div>
          </div>

          {/* Configuração Específica de Dinheiro com Cálculo Automático de Troco */}
          {formaPagamento === 'DINHEIRO' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Valor Entregue pelo Cliente (R$)
                  </label>
                  <button
                    type="button"
                    onClick={preencherValorExato}
                    className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold uppercase"
                  >
                    [Valor Exato]
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    id="input-valor-recebido"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={valorRecebidoStr}
                    onChange={(e) => setValorRecebidoStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-lg font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botões de Notas Rápidas */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Cédulas:</span>
                <button
                  type="button"
                  onClick={() => setValorRecebidoStr('20.00')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 font-semibold cursor-pointer shadow-xs"
                >
                  R$ 20
                </button>
                <button
                  type="button"
                  onClick={() => setValorRecebidoStr('50.00')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 font-semibold cursor-pointer shadow-xs"
                >
                  R$ 50
                </button>
                <button
                  type="button"
                  onClick={() => setValorRecebidoStr('100.00')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 font-semibold cursor-pointer shadow-xs"
                >
                  R$ 100
                </button>
                <button
                  type="button"
                  onClick={() => aplicarValorRapido(10)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs text-emerald-700 font-semibold cursor-pointer shadow-xs"
                >
                  +R$ 10
                </button>
              </div>

              {/* Display de Troco ou Valor Restante */}
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                {valorRecebido >= valorFinal ? (
                  <>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">TROCO A DEVOLVER:</span>
                    <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                      R$ {troco.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> VALOR FALTANTE:
                    </span>
                    <span className="text-lg font-bold text-red-600 font-mono">
                      R$ {falta.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pix Informativo */}
          {formaPagamento === 'PIX' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center space-y-2 animate-fade-in">
              <div className="inline-flex p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                <QrCode className="w-20 h-20 text-slate-800" />
              </div>
              <p className="text-xs text-blue-800 font-bold uppercase">QR Code Estático / Chave Aleatória</p>
              <p className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                mercadinho-bairro-pix@banco.com.br
              </p>
            </div>
          )}

          {/* Cartão Informativo */}
          {(formaPagamento === 'CARTAO_CREDITO' || formaPagamento === 'CARTAO_DEBITO') && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
              <div className="p-3 bg-white text-indigo-600 border border-slate-200 rounded-lg shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">
                  Insira ou Aproxime o Cartão no Pinpad/POS
                </p>
                <p className="text-xs text-slate-500">
                  Transação autorizada no montante de R$ {valorFinal.toFixed(2)}.
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de Erro de Validação */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{erro}</span>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer border border-slate-300 shadow-xs"
          >
            [Esc] Cancelar
          </button>

          <button
            id="btn-confirmar-pagamento"
            type="button"
            disabled={processandoVenda || (formaPagamento === 'DINHEIRO' && valorRecebido < valorFinal)}
            onClick={handleConfirmarVenda}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm ${
              processandoVenda || (formaPagamento === 'DINHEIRO' && valorRecebido < valorFinal)
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{processandoVenda ? 'Processando Venda...' : 'Confirmar e Emitir Cupom'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
