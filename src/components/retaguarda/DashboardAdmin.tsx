import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GestaoEstoque } from './GestaoEstoque';
import { ControleValidade } from './ControleValidade';
import { RelatoriosGerenciais } from './RelatoriosGerenciais';
import { GestaoUsuarios } from './GestaoUsuarios';
import {
  LayoutDashboard,
  Package,
  Calendar,
  TrendingUp,
  Users,
  ShoppingBag,
  FileCode2,
  LogOut,
  AlertTriangle,
  AlertOctagon,
  DollarSign,
  Store,
  RotateCcw,
} from 'lucide-react';

export const DashboardAdmin: React.FC = () => {
  const {
    usuarioLogado,
    logout,
    setTelaAtiva,
    produtos,
    lotes,
    vendas,
    resetarParaDadosIniciais,
  } = useApp();

  const [secaoAtiva, setSecaoAtiva] = useState<
    'VISAO_GERAL' | 'ESTOQUE' | 'VALIDADE' | 'RELATORIOS' | 'USUARIOS'
  >('VISAO_GERAL');

  // Métricas rápidas
  const produtosEstoqueBaixo = produtos.filter(
    (p) => p.quantidadeEstoque <= p.estoqueMinimo
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const lotesCriticos = lotes.filter((l) => {
    const validade = new Date(l.dataValidade);
    validade.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 7;
  });

  const vendasHoje = vendas.filter((v) => {
    const d = new Date(v.dataHora);
    return (
      d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  });

  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + v.valorFinal, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-500/20">
      {/* Barra de Navegação Superior */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                SISTEMA INTEGRADO • RETAGUARDA
              </h1>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                MODO ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500">Gestão Comercial & Controle de Estoque Transacional</p>
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-ir-pdv"
            type="button"
            onClick={() => setTelaAtiva('PDV')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Frente de Caixa (PDV)</span>
          </button>

          <button
            type="button"
            onClick={() => setTelaAtiva('ARQUITETURA')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileCode2 className="w-4 h-4 text-indigo-600" />
            <span>Arquitetura & Especificação</span>
          </button>

          <button
            type="button"
            onClick={resetarParaDadosIniciais}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 transition cursor-pointer"
            title="Resetar Banco de Dados para Demonstração Inicial"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 uppercase">{usuarioLogado?.nome}</p>
            <p className="text-[10px] text-blue-700 uppercase tracking-wider font-semibold">Acesso Master</p>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 rounded-lg bg-slate-100 border border-slate-300 hover:bg-red-50 hover:border-red-200 transition cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Menu de Seções da Retaguarda */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 shadow-xs">
        <nav className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setSecaoAtiva('VISAO_GERAL')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              secaoAtiva === 'VISAO_GERAL'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setSecaoAtiva('ESTOQUE')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              secaoAtiva === 'ESTOQUE'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Gestão de Estoque</span>
            {produtosEstoqueBaixo.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold font-mono">
                {produtosEstoqueBaixo.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSecaoAtiva('VALIDADE')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              secaoAtiva === 'VALIDADE'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Controle de Validade</span>
            {lotesCriticos.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold font-mono">
                {lotesCriticos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSecaoAtiva('RELATORIOS')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              secaoAtiva === 'RELATORIOS'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Relatórios & Curva ABC</span>
          </button>

          <button
            onClick={() => setSecaoAtiva('USUARIOS')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              secaoAtiva === 'USUARIOS'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Gestão de Usuários</span>
          </button>
        </nav>
      </div>

      {/* Conteúdo da Seção Ativa */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {secaoAtiva === 'VISAO_GERAL' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Cards de Indicadores do Comércio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Faturamento Hoje</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                  R$ {faturamentoHoje.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{vendasHoje.length} transações registradas</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Catálogo Ativo</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {produtos.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Produtos cadastrados na base</p>
              </div>

              <div className="bg-white border border-red-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                    Estoque Crítico
                  </span>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-3xl font-extrabold text-red-600 font-mono tracking-tight">
                  {produtosEstoqueBaixo.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Itens abaixo da cota mínima</p>
              </div>

              <div className="bg-white border border-amber-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Validade em Alerta
                  </span>
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-extrabold text-amber-800 font-mono tracking-tight">
                  {lotesCriticos.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Lotes vencendo em até 7 dias</p>
              </div>
            </div>

            {/* Painéis Rápidos de Ação e Diagnóstico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerta de Produtos Próximos ao Vencimento */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Validades Próximas (Gôndola / Estoque)
                  </h3>
                  <button
                    onClick={() => setSecaoAtiva('VALIDADE')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer uppercase"
                  >
                    Ver Lotes →
                  </button>
                </div>

                {lotesCriticos.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Nenhum lote com vencimento crítico nos próximos 7 dias.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lotesCriticos.map((lote) => (
                      <div
                        key={lote.id}
                        className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{lote.produtoNome}</p>
                          <p className="text-slate-500 text-[11px] font-mono">
                            LOTE: {lote.numeroLote} • QUANTIDADE: {lote.quantidade} un
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold border border-amber-300 rounded font-mono">
                          Vence: {new Date(lote.dataValidade).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerta de Produtos com Estoque Baixo */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" />
                    Produtos com Estoque Abaixo do Mínimo
                  </h3>
                  <button
                    onClick={() => setSecaoAtiva('ESTOQUE')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer uppercase"
                  >
                    Acessar Estoque →
                  </button>
                </div>

                {produtosEstoqueBaixo.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Todos os produtos estão com níveis de estoque acima do limite mínimo.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {produtosEstoqueBaixo.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{prod.nome}</p>
                          <p className="text-slate-500 text-[11px] font-mono">
                            CÓD: #{prod.codigoInterno} • MÍNIMO: {prod.estoqueMinimo} {prod.unidadeMedida}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold border border-red-300 rounded font-mono">
                          Atual: {prod.quantidadeEstoque} {prod.unidadeMedida}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {secaoAtiva === 'ESTOQUE' && <GestaoEstoque />}
        {secaoAtiva === 'VALIDADE' && <ControleValidade />}
        {secaoAtiva === 'RELATORIOS' && <RelatoriosGerenciais />}
        {secaoAtiva === 'USUARIOS' && <GestaoUsuarios />}
      </main>
    </div>
  );
};
