import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

export const GestaoEstoque: React.FC = () => {
  const { produtos, salvarProduto, excluirProduto } = useApp();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);

  // Modal de Produto (Novo ou Edição)
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Formulário
  const [codigoInterno, setCodigoInterno] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Mercearia');
  const [precoCusto, setPrecoCusto] = useState('0.00');
  const [precoVenda, setPrecoVenda] = useState('0.00');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState('5');
  const [unidadeMedida, setUnidadeMedida] = useState<'UN' | 'KG' | 'L' | 'PCT'>('UN');
  const [ativo, setAtivo] = useState(true);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const categorias = Array.from(new Set(produtos.map((p) => p.categoria))).filter(Boolean);

  const produtosFiltrados = produtos.filter((prod) => {
    const correspondeBusca =
      prod.nome.toLowerCase().includes(busca.toLowerCase()) ||
      prod.codigoInterno.toLowerCase().includes(busca.toLowerCase()) ||
      prod.categoria.toLowerCase().includes(busca.toLowerCase());

    const correspondeCategoria =
      filtroCategoria === 'TODAS' || prod.categoria === filtroCategoria;

    const correspondeEstoqueBaixo =
      !apenasEstoqueBaixo || prod.quantidadeEstoque <= prod.estoqueMinimo;

    return correspondeBusca && correspondeCategoria && correspondeEstoqueBaixo;
  });

  const abrirModalNovo = () => {
    setProdutoEditando(null);
    setCodigoInterno(String(produtos.length + 101));
    setNome('');
    setDescricao('');
    setCategoria('Mercearia');
    setPrecoCusto('0.00');
    setPrecoVenda('0.00');
    setQuantidadeEstoque('10');
    setEstoqueMinimo('5');
    setUnidadeMedida('UN');
    setAtivo(true);
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (prod: Produto) => {
    setProdutoEditando(prod);
    setCodigoInterno(prod.codigoInterno);
    setNome(prod.nome);
    setDescricao(prod.descricao || '');
    setCategoria(prod.categoria);
    setPrecoCusto(prod.precoCusto.toFixed(2));
    setPrecoVenda(prod.precoVenda.toFixed(2));
    setQuantidadeEstoque(String(prod.quantidadeEstoque));
    setEstoqueMinimo(String(prod.estoqueMinimo));
    setUnidadeMedida(prod.unidadeMedida);
    setAtivo(prod.ativo);
    setErroForm(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!codigoInterno.trim() || !nome.trim()) {
      setErroForm('Código Interno e Nome são campos obrigatórios.');
      return;
    }

    const custo = parseFloat(precoCusto.replace(',', '.')) || 0;
    const venda = parseFloat(precoVenda.replace(',', '.')) || 0;
    const estoque = parseFloat(quantidadeEstoque.replace(',', '.')) || 0;
    const min = parseFloat(estoqueMinimo.replace(',', '.')) || 0;

    if (venda <= 0) {
      setErroForm('O preço de venda deve ser maior que zero.');
      return;
    }

    const novoProduto: Produto = {
      id: produtoEditando ? produtoEditando.id : `prod_${Date.now()}`,
      codigoInterno: codigoInterno.trim(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      categoria: categoria.trim() || 'Mercearia',
      precoCusto: custo,
      precoVenda: venda,
      quantidadeEstoque: estoque,
      estoqueMinimo: min,
      unidadeMedida,
      ativo,
      atualizadoEm: new Date().toISOString(),
    };

    await salvarProduto(novoProduto);
    setModalAberto(false);
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) {
      await excluirProduto(id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Topo com Estatísticas e Botão Novo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Package className="w-5 h-5 text-blue-600" />
            CONTROLE DE ESTOQUE & CADASTRO DE PRODUTOS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Precificação de venda, margem de contribuição e regras de estoque mínimo.
          </p>
        </div>

        <button
          id="btn-cadastrar-produto"
          type="button"
          onClick={abrirModalNovo}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="uppercase text-[11px] font-bold">Categoria:</span>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white font-sans"
            >
              <option value="TODAS">Todas ({produtos.length})</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={apenasEstoqueBaixo}
              onChange={(e) => setApenasEstoqueBaixo(e.target.checked)}
              className="rounded text-red-600 focus:ring-0"
            />
            <span className="flex items-center gap-1 text-red-700 uppercase text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Estoque Crítico
            </span>
          </label>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-3">Cód</th>
                <th className="py-3 px-3">Nome / Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-right">P. Custo</th>
                <th className="py-3 px-3 text-right">P. Venda</th>
                <th className="py-3 px-3 text-center">Margem</th>
                <th className="py-3 px-3 text-center">Estoque Atual</th>
                <th className="py-3 px-3 text-center">Mínimo</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhum produto localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((prod) => {
                  const estoqueBaixo = prod.quantidadeEstoque <= prod.estoqueMinimo;
                  const margemLucro =
                    prod.precoCusto > 0
                      ? (((prod.precoVenda - prod.precoCusto) / prod.precoCusto) * 100).toFixed(0)
                      : '100';

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      <td className="py-3 px-3 font-bold text-blue-700 font-mono">
                        #{prod.codigoInterno}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 text-sm">{prod.nome}</p>
                        {prod.descricao && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {prod.descricao}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-medium">
                          {prod.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                        R$ {prod.precoCusto.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 text-sm font-mono">
                        R$ {prod.precoVenda.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono font-semibold">
                        +{margemLucro}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            estoqueBaixo
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {prod.quantidadeEstoque} {prod.unidadeMedida}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {prod.estoqueMinimo} {prod.unidadeMedida}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {prod.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ATIVO
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-bold">INATIVO</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => abrirModalEditar(prod)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(prod.id, prod.nome)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Produto */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {produtoEditando ? 'EDITAR PRODUTO NO CATÁLOGO' : 'CADASTRAR NOVO PRODUTO'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigoInterno}
                    onChange={(e) => setCodigoInterno(e.target.value)}
                    placeholder="Ex: 101"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs font-bold font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: Mercearia, Limpeza"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome / Descrição Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Arroz Branco 5kg Tipo 1"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-emerald-700 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estoque Atual *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={quantidadeEstoque}
                    onChange={(e) => setQuantidadeEstoque(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unidade
                  </label>
                  <select
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value as 'UN' | 'KG' | 'L' | 'PCT')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="L">L (Litro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="chk-ativo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="chk-ativo" className="text-xs text-slate-700 cursor-pointer font-sans">
                  Produto ativo para venda no caixa (PDV)
                </label>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
