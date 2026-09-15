import React, { useState } from 'react';
import { FecharVendaSaidaDTO } from '../../core/application/dtos/VendaDTOs';
import { Printer, Copy, Check, X, ReceiptText } from 'lucide-react';

interface Props {
  recibo: FecharVendaSaidaDTO;
  onFechar: () => void;
}

export const VisualizadorCupom: React.FC<Props> = ({ recibo, onFechar }) => {
  const [formato, setFormato] = useState<'58mm' | '80mm'>('58mm');
  const [copiado, setCopiado] = useState(false);

  const textoCupom =
    formato === '58mm' ? recibo.cupomNaoFiscal58mm : recibo.cupomNaoFiscal80mm;

  const handleCopiar = () => {
    navigator.clipboard.writeText(textoCupom);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleImprimir = () => {
    const janelaImpressao = window.open('', '_blank', 'width=450,height=700');
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <html>
          <head>
            <title>Cupom Não Fiscal #${recibo.venda.numeroCupom}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: ${formato === '58mm' ? '12px' : '13px'};
                white-space: pre-wrap;
                margin: 10px;
                line-height: 1.25;
                color: #000;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${textoCupom}</body>
        </html>
      `);
      janelaImpressao.document.close();
      janelaImpressao.focus();
      setTimeout(() => {
        janelaImpressao.print();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans selection:bg-blue-500/20">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                CUPOM NÃO FISCAL #{String(recibo.venda.numeroCupom).padStart(6, '0')}
              </h3>
              <p className="text-[11px] text-emerald-700 font-semibold">TRANSAÇÃO CONCLUÍDA COM SUCESSO</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Formato (58mm vs 80mm) */}
        <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">Largura da Bobina:</span>
          <div className="flex bg-slate-200 p-0.5 rounded border border-slate-300">
            <button
              onClick={() => setFormato('58mm')}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                formato === '58mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              58mm (32 Colunas)
            </button>
            <button
              onClick={() => setFormato('80mm')}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                formato === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              80mm (48 Colunas)
            </button>
          </div>
        </div>

        {/* Visualização Estilo Bobina Térmica */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            className={`bg-white text-slate-950 font-mono text-xs p-4 rounded shadow-md border border-slate-300 select-all leading-relaxed whitespace-pre font-bold ${
              formato === '58mm' ? 'w-[310px]' : 'w-[420px]'
            }`}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            {textoCupom}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleCopiar}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onFechar}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            Próxima Venda [OK]
          </button>
        </div>
      </div>
    </div>
  );
};
