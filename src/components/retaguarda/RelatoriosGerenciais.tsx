import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CalculadoraCurvaABCService } from '../../core/application/services/CalculadoraCurvaABCService';
import { GeradorCupomNaoFiscalService } from '../../core/application/services/GeradorCupomNaoFiscalService';
import { VisualizadorCupom } from '../pdv/VisualizadorCupom';
import { FecharVendaSaidaDTO } from '../../core/application/dtos/VendaDTOs';
import { Venda } from '../../types';
import {
  TrendingUp,
  BarChart3,
  Receipt,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const RelatoriosGerenciais: React.FC = () => {
  const { vendas, produtos } = useApp();

  const [abaAtiva, setAbaAtiva] = useState<'CURVA_ABC' | 'HISTORICO_VENDAS'>('CURVA_ABC');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'TODOS' | 'HOJE' | 'MES'>('TODOS');
  const [vendaVisualizando, setVendaVisualizando] = useState<FecharVendaSaidaDTO | null>(null);

  // Filtragem de vendas por período
  const vendasFiltradas = useMemo(() => {
    const hoje = new Date();
    const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).getTime();

    return vendas.filter((v) => {
      const tempo = new Date(v.dataHora).getTime();
      if (filtroPeriodo === 'HOJE') {
        return tempo >= hojeInicio;
      }
      if (filtroPeriodo === 'MES') {
        return tempo >= mesInicio;
      }
      return true;
    });
  }, [vendas, filtroPeriodo]);

  // Indicadores Gerenciais
  const totalFaturamento = useMemo(() => {
    return vendasFiltradas.reduce((acc, v) => acc + v.valorFinal, 0);
  }, [vendasFiltradas]);

  const totalCupons = vendasFiltradas.length;
  const ticketMedio = totalCupons > 0 ? totalFaturamento / totalCupons : 0;

  // Curva ABC
  const itensCurvaABC = useMemo(() => {
    return CalculadoraCurvaABCService.calcular(produtos, vendasFiltradas);
  }, [produtos, vendasFiltradas]);

  const itensClasseA = itensCurvaABC.filter((i) => i.classificacao === 'A');
  const itensClasseB = itensCurvaABC.filter((i) => i.classificacao === 'B');
  const itensClasseC = itensCurvaABC.filter((i) => i.classificacao === 'C');

  const abrirCupomHistorico = (venda: Venda) => {
    const dto: FecharVendaSaidaDTO = {
      sucesso: true,
      venda,
      troco: venda.troco || 0,
      cupomNaoFiscal58mm: GeradorCupomNaoFiscalService.gerarCupom58mm(venda),
      cupomNaoFiscal80mm: GeradorCupomNaoFiscalService.gerarCupom80mm(venda),
    };
    setVendaVisualizando(dto);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            RELATÓRIOS GERENCIAIS & CURVA ABC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoria de faturamento bruto, inteligência de sortimento e histórico de vendas.
          </p>
        </div>

        {/* Filtro de Período */}
        <div className="flex bg-slate-100 border border-slate-300 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFiltroPeriodo('HOJE')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider transition cursor-pointer ${
              filtroPeriodo === 'HOJE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFiltroPeriodo('MES')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider transition cursor-pointer ${
              filtroPeriodo === 'MES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setFiltroPeriodo('TODOS')}
            className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider transition cursor-pointer ${
              filtroPeriodo === 'TODOS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todo Histórico
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Faturamento Bruto
          </span>
          <p className="text-3xl font-bold text-emerald-700 font-mono mt-1">
            R$ {totalFaturamento.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Receita total no período selecionado</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cupons Emitidos
          </span>
          <p className="text-3xl font-bold text-slate-900 font-mono mt-1">
            {totalCupons}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Transações finalizadas no PDV</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Ticket Médio
          </span>
          <p className="text-3xl font-bold text-blue-700 font-mono mt-1">
            R$ {ticketMedio.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Gasto médio por cliente</p>
        </div>
      </div>

      {/* Abas dos Relatórios */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setAbaAtiva('CURVA_ABC')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
            abaAtiva === 'CURVA_ABC'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Curva ABC (Classificação por Faturamento)</span>
        </button>

        <button
          onClick={() => setAbaAtiva('HISTORICO_VENDAS')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
            abaAtiva === 'HISTORICO_VENDAS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Histórico de Vendas & Cupons ({vendasFiltradas.length})</span>
        </button>
      </div>

      {/* CONTEÚDO 1: RELATÓRIO DE CURVA ABC */}
      {abaAtiva === 'CURVA_ABC' && (
        <div className="space-y-4 animate-fade-in">
          {/* Explicação Didática da Curva ABC */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Classificação Estratégica de Sortimento (Princípio de Pareto)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="font-bold text-emerald-800 uppercase tracking-wider">Classe A (Alto Giro - até 80%)</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Produtos motores de faturamento ({itensClasseA.length} itens). Ruptura zero permitida na gôndola.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-800 uppercase tracking-wider">Classe B (Médio Giro - 80% a 95%)</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Itens intermediários ({itensClasseB.length} itens). Demanda equilibrada com fluxo constante.
                </p>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Classe C (Baixo Giro - acima de 95%)</span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Cauda longa ({itensClasseC.length} itens). Baixo faturamento acumulado, exige estoque reduzido.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Produtos Ordenados com Curva ABC */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-3">Classificação</th>
                    <th className="py-3 px-3">Cód</th>
                    <th className="py-3 px-3">Produto</th>
                    <th className="py-3 px-3 text-center">Qtd Vendida</th>
                    <th className="py-3 px-3 text-right">Faturamento Total</th>
                    <th className="py-3 px-3 text-right">% Faturamento</th>
                    <th className="py-3 px-3 text-right">% Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itensCurvaABC.map((item) => {
                    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
                    if (item.classificacao === 'A') {
                      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                    } else if (item.classificacao === 'B') {
                      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                    }

                    return (
                      <tr key={item.produtoId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-1 rounded text-xs border uppercase tracking-wider ${badgeClass}`}>
                            CLASSE {item.classificacao}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-700 font-mono">
                          #{item.codigoInterno}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 text-sm">{item.nomeProduto}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                          {item.quantidadeVendida} un
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono text-sm">
                          R$ {item.faturamentoTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          {item.percentualFaturamento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right text-blue-700 font-mono font-bold">
                          {item.percentualAcumulado.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: HISTÓRICO DE VENDAS E VISUALIZAÇÃO DE CUPONS */}
      {abaAtiva === 'HISTORICO_VENDAS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-3 px-3">Nº Cupom</th>
                  <th className="py-3 px-3">Data e Hora</th>
                  <th className="py-3 px-3">Operador</th>
                  <th className="py-3 px-3 text-center">Itens</th>
                  <th className="py-3 px-3">Forma Pagto</th>
                  <th className="py-3 px-3 text-right">Valor Final</th>
                  <th className="py-3 px-3 text-right">Cupom Térmico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma venda registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  vendasFiltradas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-blue-700 font-mono">
                        #{String(venda.numeroCupom).padStart(6, '0')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {new Date(venda.dataHora).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-medium">
                        {venda.operadorNome}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 font-mono font-semibold">
                        {venda.itens.reduce((acc, i) => acc + i.quantidade, 0)} un
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] font-bold">
                          {venda.formaPagamento}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono text-sm">
                        R$ {venda.valorFinal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => abrirCupomHistorico(venda)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase flex items-center gap-1.5 ml-auto transition cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ver Cupom</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Revisualização de Cupom */}
      {vendaVisualizando && (
        <VisualizadorCupom
          recibo={vendaVisualizando}
          onFechar={() => setVendaVisualizando(null)}
        />
      )}
    </div>
  );
};
