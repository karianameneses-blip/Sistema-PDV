import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoteValidade } from '../../types';
import {
  Calendar,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  X,
  Clock,
} from 'lucide-react';

export const ControleValidade: React.FC = () => {
  const { lotes, produtos, salvarLote, excluirLote } = useApp();

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoId, setProdutoId] = useState(produtos[0]?.id || '');
  const [numeroLote, setNumeroLote] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [dataFabricacao, setDataFabricacao] = useState('');
  const [quantidade, setQuantidade] = useState('10');
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Calcular dias restantes
  const calcularDiasRestantes = (dataStr: string): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataStr);
    validade.setHours(0, 0, 0, 0);
    const diffMs = validade.getTime() - hoje.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Classificação dos lotes
  const lotesProcessados = lotes.map((lote) => {
    const produto = produtos.find((p) => p.id === lote.produtoId);
    const dias = calcularDiasRestantes(lote.dataValidade);

    let statusValidade: 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'REGULAR' = 'REGULAR';
    if (dias < 0) statusValidade = 'VENCIDO';
    else if (dias <= 7) statusValidade = 'CRITICO';
    else if (dias <= 30) statusValidade = 'ATENCAO';

    return {
      ...lote,
      produtoNome: produto ? produto.nome : (lote.produtoNome || 'Produto não encontrado'),
      codigoInterno: produto ? produto.codigoInterno : '-',
      unidadeMedida: produto ? produto.unidadeMedida : 'UN',
      diasRestantes: dias,
      statusValidade,
    };
  });

  // Ordenar: mais urgentes primeiro
  lotesProcessados.sort((a, b) => a.diasRestantes - b.diasRestantes);

  const contagemCriticos = lotesProcessados.filter((l) => l.statusValidade === 'CRITICO' || l.statusValidade === 'VENCIDO').length;
  const contagemAtencao = lotesProcessados.filter((l) => l.statusValidade === 'ATENCAO').length;

  const abrirModalNovo = () => {
    setProdutoId(produtos[0]?.id || '');
    setNumeroLote(`LT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    // Sugerir validade de 30 dias
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDataValidade(d.toISOString().split('T')[0]);
    setDataFabricacao(new Date().toISOString().split('T')[0]);
    setQuantidade('10');
    setErroForm(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!produtoId || !numeroLote.trim() || !dataValidade) {
      setErroForm('Preencha todos os campos obrigatórios.');
      return;
    }

    const qtd = parseFloat(quantidade) || 0;
    if (qtd <= 0) {
      setErroForm('Quantidade do lote deve ser maior que zero.');
      return;
    }

    const prod = produtos.find((p) => p.id === produtoId);

    const novoLote: LoteValidade = {
      id: `lote_${Date.now()}`,
      produtoId,
      produtoNome: prod?.nome,
      numeroLote: numeroLote.trim(),
      dataFabricacao: dataFabricacao || undefined,
      dataValidade,
      quantidade: qtd,
      dataEntrada: new Date().toISOString().split('T')[0],
    };

    await salvarLote(novoLote);
    setModalAberto(false);
  };

  const handleExcluir = async (id: string, lote: string) => {
    if (confirm(`Remover o registro do lote "${lote}"?`)) {
      await excluirLote(id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Topo e Métricas de Alerta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="w-5 h-5 text-blue-600" />
            CONTROLE DE VALIDADES & MONITORAMENTO FIFO
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreamento de lotes por data crítica para redução de quebras e controle de gôndola.
          </p>
        </div>

        <button
          id="btn-cadastrar-lote"
          type="button"
          onClick={abrirModalNovo}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Lote</span>
        </button>
      </div>

      {/* Cards de Resumo Visual de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-red-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              Urgência Crítica (≤ 7 dias)
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{contagemCriticos} lotes</p>
            <p className="text-[11px] text-slate-500">Requer promoção ou queima imediata</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Atenção (8 a 30 dias)
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{contagemAtencao} lotes</p>
            <p className="text-[11px] text-slate-500">Priorizar no rodízio de gôndola (FIFO)</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Validade Regular (&gt; 30 dias)
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {lotesProcessados.length - contagemCriticos - contagemAtencao} lotes
            </p>
            <p className="text-[11px] text-slate-500">Prazo de consumo regular e estável</p>
          </div>
        </div>
      </div>

      {/* Tabela de Lotes com Alertas Visuais */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-3">Status de Alerta</th>
                <th className="py-3 px-3">Cód</th>
                <th className="py-3 px-3">Produto</th>
                <th className="py-3 px-3">Nº do Lote</th>
                <th className="py-3 px-3 text-center">Data Validade</th>
                <th className="py-3 px-3 text-center">Dias Restantes</th>
                <th className="py-3 px-3 text-center">Qtd no Lote</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lotesProcessados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum lote cadastrado no momento.
                  </td>
                </tr>
              ) : (
                lotesProcessados.map((lote) => {
                  let badge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      REGULAR
                    </span>
                  );
                  if (lote.statusValidade === 'VENCIDO') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                        VENCIDO
                      </span>
                    );
                  } else if (lote.statusValidade === 'CRITICO') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                        <AlertOctagon className="w-3 h-3" /> Crítico (&lt; 7 dias)
                      </span>
                    );
                  } else if (lote.statusValidade === 'ATENCAO') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Atenção (&lt; 30 dias)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={lote.id}
                      className={`hover:bg-slate-50/80 transition ${
                        lote.statusValidade === 'CRITICO' || lote.statusValidade === 'VENCIDO'
                          ? 'bg-red-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3">{badge}</td>
                      <td className="py-3 px-3 font-bold text-blue-700 font-mono">
                        #{lote.codigoInterno}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 text-sm">{lote.produtoNome}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-mono font-medium">
                        {lote.numeroLote}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 font-mono font-bold">
                        {new Date(lote.dataValidade).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className={`font-bold text-sm ${
                            lote.diasRestantes <= 7
                              ? 'text-red-600'
                              : lote.diasRestantes <= 30
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {lote.diasRestantes < 0
                            ? `Venceu há ${Math.abs(lote.diasRestantes)}d`
                            : `${lote.diasRestantes} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800 font-mono font-semibold">
                        {lote.quantidade} {lote.unidadeMedida}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleExcluir(lote.id, lote.numeroLote)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Remover Lote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Inserção de Novo Lote */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                CADASTRAR LOTE & VENCIMENTO
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-5 space-y-4">
              {erroForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-bold">
                  {erroForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Selecione o Produto *
                </label>
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 font-sans"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.codigoInterno} - {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Identificador / Nº do Lote *
                </label>
                <input
                  type="text"
                  required
                  value={numeroLote}
                  onChange={(e) => setNumeroLote(e.target.value)}
                  placeholder="Ex: LT-2026-09A"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Data Fabricação
                  </label>
                  <input
                    type="date"
                    value={dataFabricacao}
                    onChange={(e) => setDataFabricacao(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Data Validade *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-blue-700 font-bold text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quantidade no Lote *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Gravar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
