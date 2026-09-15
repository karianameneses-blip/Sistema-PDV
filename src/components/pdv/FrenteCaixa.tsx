import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { ModalPagamento } from './ModalPagamento';
import { VisualizadorCupom } from './VisualizadorCupom';
import {
  Search,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Layers,
  AlertCircle,
  Clock,
  User,
  LogOut,
  SlidersHorizontal,
  FileCode2,
} from 'lucide-react';

export const FrenteCaixa: React.FC = () => {
  const {
    usuarioLogado,
    logout,
    setTelaAtiva,
    produtos,
    carrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidadeItem,
    limparCarrinho,
    totalCarrinho,
    totalItensCarrinho,
    ultimoRecibo,
    fecharModalRecibo,
  } = useApp();

  // Estados de entrada do operador
  const [termoBusca, setTermoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [indiceFocoAutocompletar, setIndiceFocoAutocompletar] = useState<number>(-1);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState<string | null>(null);

  // Modal de Pagamento
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);

  // Relógio
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString('pt-BR'));

  // Refs de foco
  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const inputQtdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Produtos filtrados para autocomplete
  const produtosFiltrados = React.useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return [];
    return produtos
      .filter(
        (p) =>
          p.ativo &&
          (p.codigoInterno.toLowerCase().startsWith(termo) ||
            p.nome.toLowerCase().includes(termo))
      )
      .slice(0, 7);
  }, [produtos, termoBusca]);

  // Teclas de Atalho Globais (F10, F2, F3, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F10 - Fechar Venda
      if (e.key === 'F10') {
        e.preventDefault();
        if (carrinho.length > 0 && !modalPagamentoAberto) {
          setModalPagamentoAberto(true);
        } else if (carrinho.length === 0) {
          setMensagemAviso('O carrinho está vazio. Adicione ao menos um item antes de fechar a venda.');
        }
      }

      // F3 - Focar no campo de busca de produtos
      if (e.key === 'F3') {
        e.preventDefault();
        inputBuscaRef.current?.focus();
        inputBuscaRef.current?.select();
      }

      // F2 - Limpar carrinho (com confirmação rápida)
      if (e.key === 'F2') {
        e.preventDefault();
        if (carrinho.length > 0) {
          if (confirm('Deseja realmente cancelar a venda atual e limpar o carrinho?')) {
            limparCarrinho();
            setProdutoSelecionado(null);
            setTermoBusca('');
            inputBuscaRef.current?.focus();
          }
        }
      }

      // Escape fecha modal se estiver aberto
      if (e.key === 'Escape') {
        if (modalPagamentoAberto) {
          setModalPagamentoAberto(false);
        } else {
          setMostrarDropdown(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho, modalPagamentoAberto, limparCarrinho]);

  // Navegação no dropdown de autocomplete
  const handleBuscaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (produtosFiltrados.length > 0) {
        setIndiceFocoAutocompletar((prev) =>
          prev < produtosFiltrados.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (produtosFiltrados.length > 0) {
        setIndiceFocoAutocompletar((prev) =>
          prev > 0 ? prev - 1 : produtosFiltrados.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceFocoAutocompletar >= 0 && produtosFiltrados[indiceFocoAutocompletar]) {
        selecionarProduto(produtosFiltrados[indiceFocoAutocompletar]);
      } else if (produtosFiltrados.length === 1) {
        selecionarProduto(produtosFiltrados[0]);
      } else if (produtoSelecionado) {
        inputQtdRef.current?.focus();
        inputQtdRef.current?.select();
      }
    }
  };

  const selecionarProduto = (prod: Produto) => {
    setProdutoSelecionado(prod);
    setTermoBusca(`${prod.codigoInterno} - ${prod.nome}`);
    setMostrarDropdown(false);
    setMensagemAviso(null);

    // Focar no campo de quantidade para digitação rápida
    setTimeout(() => {
      inputQtdRef.current?.focus();
      inputQtdRef.current?.select();
    }, 50);
  };

  const handleQtdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionarItem();
    }
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionado) {
      setMensagemAviso('Localize e selecione um produto antes de adicionar.');
      inputBuscaRef.current?.focus();
      return;
    }

    if (quantidade <= 0) {
      setMensagemAviso('A quantidade deve ser de no mínimo 1 unidade.');
      return;
    }

    const res = adicionarAoCarrinho(produtoSelecionado, quantidade);
    if (!res.sucesso) {
      setMensagemAviso(res.mensagem || 'Estoque insuficiente.');
    } else {
      setMensagemAviso(null);
      // Resetar para a próxima adição imediata
      setProdutoSelecionado(null);
      setTermoBusca('');
      setQuantidade(1);
      inputBuscaRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none selection:bg-blue-500/20">
      {/* Barra de Status Superior do Terminal PDV */}
      <header className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-xs tracking-wider text-blue-800 uppercase">PDV-01 : ATIVO</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">COMÉRCIO DE BAIRRO</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold">{horaAtual}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>OPERADOR: <strong className="text-slate-900">{usuarioLogado?.nome.toUpperCase()}</strong></span>
          </div>

          {/* Se for Administrador, atalhos para Retaguarda e Especificação */}
          {usuarioLogado?.papel === 'ADMINISTRADOR' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTelaAtiva('DASHBOARD')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center gap-1.5 transition cursor-pointer font-semibold uppercase text-[11px]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Retaguarda</span>
              </button>
              <button
                onClick={() => setTelaAtiva('ARQUITETURA')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center gap-1.5 transition cursor-pointer font-semibold uppercase text-[11px]"
              >
                <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Arquitetura</span>
              </button>
            </div>
          )}

          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition cursor-pointer"
            title="Sair do Terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal do PDV */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1680px] w-full mx-auto">
        {/* COLUNA ESQUERDA: ENTRADA MANUAL E PESQUISA DE PRODUTOS (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card de Busca Rápida e Adição Manual */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                LOCALIZAR PRODUTO [F3]
              </label>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                DIGITAÇÃO RÁPIDA
              </span>
            </div>

            {/* Input com Autocomplete Dinâmico */}
            <div className="relative">
              <input
                ref={inputBuscaRef}
                type="text"
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value);
                  setMostrarDropdown(true);
                  setIndiceFocoAutocompletar(0);
                  if (produtoSelecionado && e.target.value !== `${produtoSelecionado.codigoInterno} - ${produtoSelecionado.nome}`) {
                    setProdutoSelecionado(null);
                  }
                }}
                onFocus={() => {
                  if (termoBusca) setMostrarDropdown(true);
                }}
                onKeyDown={handleBuscaKeyDown}
                placeholder="Código (ex: 101) ou nome do item..."
                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              />

              {/* Lista suspensa de autocompletar */}
              {mostrarDropdown && produtosFiltrados.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {produtosFiltrados.map((prod, idx) => (
                    <div
                      key={prod.id}
                      onClick={() => selecionarProduto(prod)}
                      className={`p-3 cursor-pointer flex items-center justify-between transition ${
                        idx === indiceFocoAutocompletar
                          ? 'bg-blue-50 text-blue-950 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            #{prod.codigoInterno}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{prod.nome}</span>
                        </div>
                        <span className="text-xs text-slate-500">{prod.categoria} • Estoque: {prod.quantidadeEstoque} {prod.unidadeMedida}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700">
                          R$ {prod.precoVenda.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalhes do Produto Selecionado */}
            {produtoSelecionado ? (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col gap-2 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      [ITEM SELECIONADO PARA INCLUSÃO]
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{produtoSelecionado.nome}</h4>
                    <p className="text-xs text-slate-600">
                      CÓD: #{produtoSelecionado.codigoInterno} • SETOR: {produtoSelecionado.categoria.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Preço Unitário</span>
                    <p className="text-xl font-bold text-emerald-700">
                      R$ {produtoSelecionado.precoVenda.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-xs">
                  <span className="text-slate-600">Estoque Disponível:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded border ${
                      produtoSelecionado.quantidadeEstoque <= produtoSelecionado.estoqueMinimo
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {produtoSelecionado.quantidadeEstoque} {produtoSelecionado.unidadeMedida}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Aguardando seleção de produto. Digite código ou nome acima.
              </div>
            )}

            {/* Quantidade e Botão Adicionar */}
            <div className="grid grid-cols-12 gap-2 pt-1">
              <div className="col-span-5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quantidade
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-l-lg border border-slate-300 text-sm font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    ref={inputQtdRef}
                    type="number"
                    min="1"
                    step="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    onKeyDown={handleQtdKeyDown}
                    className="w-full text-center py-2.5 bg-white border-y border-slate-300 text-slate-900 font-bold text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-r-lg border border-slate-300 text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="col-span-7 flex items-end">
                <button
                  type="button"
                  onClick={handleAdicionarItem}
                  disabled={!produtoSelecionado}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                    produtoSelecionado
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/20'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir Item [Enter]</span>
                </button>
              </div>
            </div>

            {/* Aviso de Negócio / Estoque */}
            {mensagemAviso && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{mensagemAviso}</span>
              </div>
            )}
          </div>

          {/* Painel Informativo Rápido de Produtos Populares */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Itens Rápidos de Alta Rotatividade
            </h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-56 pr-1">
              {produtos.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => selecionarProduto(p)}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                    <span className="truncate group-hover:text-blue-700">{p.nome}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">#{p.codigoInterno}</span>
                    <span className="font-bold text-emerald-700">R$ {p.precoVenda.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARRINHO DE ITENS E FECHAMENTO (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col">
            {/* Header da Lista de Itens */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  ITENS DA VENDA [{carrinho.length}]
                </h2>
              </div>
              {carrinho.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Limpar todos os itens da venda?')) limparCarrinho();
                  }}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancelar Venda [F2]</span>
                </button>
              )}
            </div>

            {/* Tabela de Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto my-2 min-h-[300px] max-h-[460px]">
              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 text-slate-400 shadow-sm">
                    <Package className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-sm text-slate-700 uppercase tracking-wider">CARRINHO LIVRE</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Pressione [F3] ou pesquise o código/nome do produto à esquerda para registrar.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">CÓD</th>
                      <th className="py-2.5 px-2">DESCRIÇÃO</th>
                      <th className="py-2.5 px-2 text-center">QTD</th>
                      <th className="py-2.5 px-2 text-right">UNITÁRIO</th>
                      <th className="py-2.5 px-2 text-right">SUBTOTAL</th>
                      <th className="py-2.5 px-2 text-center">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {carrinho.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition group"
                      >
                        <td className="py-2.5 px-2 text-slate-400 font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-2 text-blue-700 font-bold font-mono">
                          {item.codigoInterno}
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-slate-900 max-w-[200px] truncate">
                          {item.nomeProduto}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center bg-white border border-slate-300 rounded shadow-sm">
                            <button
                              onClick={() => atualizarQuantidadeItem(index, item.quantidade - 1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-slate-900 font-mono">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => atualizarQuantidadeItem(index, item.quantidade + 1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                          R$ {item.valorUnitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-700 text-sm font-mono">
                          R$ {item.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => removerDoCarrinho(index)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Remover item [Del]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé Financeiro e Painel de Fechamento */}
            <div className="pt-3 border-t border-slate-200 mt-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Itens Totais</span>
                    <p className="text-xl font-bold text-slate-900 font-mono">
                      {totalItensCarrinho}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Subtotal</span>
                    <p className="text-xl font-semibold text-slate-700 font-mono">
                      R$ {totalCarrinho.toFixed(2)}
                    </p>
                  </div>
                  <div className="border-l border-slate-300 pl-5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      TOTAL A RECEBER
                    </span>
                    <p className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">
                      R$ {totalCarrinho.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-abrir-fechamento-venda"
                  type="button"
                  disabled={carrinho.length === 0}
                  onClick={() => setModalPagamentoAberto(true)}
                  className={`w-full sm:w-auto px-7 py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                    carrinho.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Fechar Venda [F10]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior com Guia de Teclas de Atalho */}
      <footer className="bg-white border-t border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">COMANDOS DO TECLADO:</span>
          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold">
            [F10] FECHAR VENDA
          </span>
          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 font-bold">
            [F3] BUSCA PRODUTO
          </span>
          <span className="px-2 py-0.5 bg-red-50 border border-red-200 rounded text-red-800 font-bold">
            [F2] CANCELAR VENDA
          </span>
          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800 font-bold">
            [ENTER] INCLUIR ITEM
          </span>
        </div>

        <div className="text-[11px] text-slate-400 uppercase tracking-wider">
          CUPOM NÃO FISCAL • CONTROLE TRANSACIONAL RIGOROSO
        </div>
      </footer>

      {/* Modais Integrados */}
      <ModalPagamento
        aberto={modalPagamentoAberto}
        onFechar={() => setModalPagamentoAberto(false)}
      />

      {ultimoRecibo && (
        <VisualizadorCupom
          recibo={ultimoRecibo}
          onFechar={fecharModalRecibo}
        />
      )}
    </div>
  );
};
