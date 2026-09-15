import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  FormaPagamento,
  ItemVenda,
  LoteValidade,
  Produto,
  Usuario,
  Venda,
} from '../types';
import {
  LocalStorageLoteRepository,
  LocalStorageProdutoRepository,
  LocalStorageUsuarioRepository,
  LocalStorageVendaRepository,
} from '../core/infrastructure/LocalStorageRepositories';
import { FecharVendaUseCase } from '../core/application/use-cases/FecharVendaUseCase';
import { FecharVendaSaidaDTO } from '../core/application/dtos/VendaDTOs';
import { DominioException } from '../core/domain/exceptions/DominioExceptions';

export type TelaAtiva =
  | 'LOGIN'
  | 'PDV'
  | 'DASHBOARD'
  | 'ESTOQUE'
  | 'VALIDADE'
  | 'RELATORIOS'
  | 'USUARIOS'
  | 'ARQUITETURA';

interface AppContextType {
  usuarioLogado: Usuario | null;
  telaAtiva: TelaAtiva;
  setTelaAtiva: (tela: TelaAtiva) => void;
  login: (loginInput: string, senhaInput: string) => { sucesso: boolean; mensagem?: string };
  logout: () => void;

  // Catálogo e Estoque
  produtos: Produto[];
  recarregarProdutos: () => Promise<void>;
  salvarProduto: (produto: Produto) => Promise<void>;
  excluirProduto: (id: string) => Promise<void>;

  // Lotes e Validade
  lotes: LoteValidade[];
  recarregarLotes: () => Promise<void>;
  salvarLote: (lote: LoteValidade) => Promise<void>;
  excluirLote: (id: string) => Promise<void>;

  // Vendas e Histórico
  vendas: Venda[];
  recarregarVendas: () => Promise<void>;

  // Usuários do Sistema
  usuarios: Usuario[];
  recarregarUsuarios: () => Promise<void>;
  salvarUsuario: (usuario: Usuario) => Promise<void>;

  // Frente de Caixa / Carrinho
  carrinho: ItemVenda[];
  adicionarAoCarrinho: (produto: Produto, quantidade: number) => { sucesso: boolean; mensagem?: string };
  removerDoCarrinho: (index: number) => void;
  atualizarQuantidadeItem: (index: number, quantidade: number) => { sucesso: boolean; mensagem?: string };
  limparCarrinho: () => void;
  totalCarrinho: number;
  totalItensCarrinho: number;

  // Fechamento de Venda
  processandoVenda: boolean;
  finalizarVenda: (
    formaPagamento: FormaPagamento,
    valorRecebido?: number,
    desconto?: number
  ) => Promise<{ sucesso: boolean; resultado?: FecharVendaSaidaDTO; erro?: string }>;

  // Cupom Concluído
  ultimoRecibo: FecharVendaSaidaDTO | null;
  fecharModalRecibo: () => void;

  // Utilitários de demonstração
  resetarParaDadosIniciais: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Instâncias dos Repositórios (Inversão de Dependência)
  const produtoRepo = useMemo(() => new LocalStorageProdutoRepository(), []);
  const vendaRepo = useMemo(() => new LocalStorageVendaRepository(), []);
  const usuarioRepo = useMemo(() => new LocalStorageUsuarioRepository(), []);
  const loteRepo = useMemo(() => new LocalStorageLoteRepository(), []);

  // Instância do Caso de Uso de Fechamento de Venda
  const fecharVendaUseCase = useMemo(
    () => new FecharVendaUseCase(produtoRepo, vendaRepo),
    [produtoRepo, vendaRepo]
  );

  // Estados principais
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
    const salvo = sessionStorage.getItem('pdv_usuario_sessao');
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>(() => {
    const salvo = sessionStorage.getItem('pdv_usuario_sessao');
    if (salvo) {
      try {
        const u = JSON.parse(salvo);
        return u.papel === 'ADMINISTRADOR' ? 'DASHBOARD' : 'PDV';
      } catch {
        return 'LOGIN';
      }
    }
    return 'LOGIN';
  });

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lotes, setLotes] = useState<LoteValidade[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [processandoVenda, setProcessandoVenda] = useState(false);
  const [ultimoRecibo, setUltimoRecibo] = useState<FecharVendaSaidaDTO | null>(null);

  // Carregamento inicial
  const recarregarProdutos = async () => {
    const prods = await produtoRepo.listarTodos();
    setProdutos([...prods]);
  };

  const recarregarLotes = async () => {
    const lts = await loteRepo.listarTodos();
    setLotes([...lts]);
  };

  const recarregarVendas = async () => {
    const vnds = await vendaRepo.listarVendas();
    setVendas([...vnds]);
  };

  const recarregarUsuarios = async () => {
    const usrs = await usuarioRepo.listarTodos();
    setUsuarios([...usrs]);
  };

  useEffect(() => {
    recarregarProdutos();
    recarregarLotes();
    recarregarVendas();
    recarregarUsuarios();
  }, []);

  // Autenticação
  const login = (loginInput: string, senhaInput: string) => {
    const usuarioEncontrado = usuarios.find(
      (u) =>
        u.login.toLowerCase() === loginInput.trim().toLowerCase() &&
        u.senhaHash === senhaInput &&
        u.ativo
    );

    if (!usuarioEncontrado) {
      return { sucesso: false, mensagem: 'Credenciais inválidas ou usuário inativo.' };
    }

    setUsuarioLogado(usuarioEncontrado);
    sessionStorage.setItem('pdv_usuario_sessao', JSON.stringify(usuarioEncontrado));

    // Redirecionamento automático com base na role
    if (usuarioEncontrado.papel === 'ADMINISTRADOR') {
      setTelaAtiva('DASHBOARD');
    } else {
      setTelaAtiva('PDV');
    }

    return { sucesso: true };
  };

  const logout = () => {
    setUsuarioLogado(null);
    sessionStorage.removeItem('pdv_usuario_sessao');
    setCarrinho([]);
    setTelaAtiva('LOGIN');
  };

  // Gestão de Estoque e Produtos
  const salvarProduto = async (produto: Produto) => {
    const existe = produtos.some((p) => p.id === produto.id);
    if (existe) {
      await produtoRepo.atualizar(produto);
    } else {
      await produtoRepo.salvar(produto);
    }
    await recarregarProdutos();
  };

  const excluirProduto = async (id: string) => {
    await produtoRepo.excluir(id);
    await recarregarProdutos();
  };

  // Gestão de Lotes
  const salvarLote = async (lote: LoteValidade) => {
    await loteRepo.salvar(lote);
    await recarregarLotes();
  };

  const excluirLote = async (id: string) => {
    await loteRepo.excluir(id);
    await recarregarLotes();
  };

  // Gestão de Usuários
  const salvarUsuario = async (usuario: Usuario) => {
    const existe = usuarios.some((u) => u.id === usuario.id);
    if (existe) {
      await usuarioRepo.atualizar(usuario);
    } else {
      await usuarioRepo.salvar(usuario);
    }
    await recarregarUsuarios();
  };

  // Operações do Carrinho
  const adicionarAoCarrinho = (produto: Produto, quantidade: number) => {
    if (quantidade <= 0) {
      return { sucesso: false, mensagem: 'Quantidade informada deve ser maior que zero.' };
    }

    // Verificar se o item já está no carrinho
    const itemExistente = carrinho.find((item) => item.produtoId === produto.id);
    const quantidadeNoCarrinho = itemExistente ? itemExistente.quantidade : 0;
    const quantidadeTotalNecessaria = quantidadeNoCarrinho + quantidade;

    // Checagem de saldo
    if (quantidadeTotalNecessaria > produto.quantidadeEstoque) {
      return {
        sucesso: false,
        mensagem: `Estoque insuficiente! O produto possui apenas ${produto.quantidadeEstoque} em estoque (já existem ${quantidadeNoCarrinho} no carrinho).`,
      };
    }

    if (itemExistente) {
      setCarrinho((prev) =>
        prev.map((item) => {
          if (item.produtoId === produto.id) {
            const novaQtd = item.quantidade + quantidade;
            return {
              ...item,
              quantidade: novaQtd,
              subtotal: Number((novaQtd * item.valorUnitario).toFixed(2)),
            };
          }
          return item;
        })
      );
    } else {
      const novoItem: ItemVenda = {
        id: crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`,
        produtoId: produto.id,
        codigoInterno: produto.codigoInterno,
        nomeProduto: produto.nome,
        quantidade,
        valorUnitario: produto.precoVenda,
        subtotal: Number((quantidade * produto.precoVenda).toFixed(2)),
      };
      setCarrinho((prev) => [novoItem, ...prev]);
    }

    return { sucesso: true };
  };

  const atualizarQuantidadeItem = (index: number, novaQuantidade: number) => {
    const item = carrinho[index];
    if (!item) return { sucesso: false, mensagem: 'Item não encontrado.' };

    if (novaQuantidade <= 0) {
      removerDoCarrinho(index);
      return { sucesso: true };
    }

    const produtoOriginal = produtos.find((p) => p.id === item.produtoId);
    if (produtoOriginal && novaQuantidade > produtoOriginal.quantidadeEstoque) {
      return {
        sucesso: false,
        mensagem: `Estoque insuficiente! Disponível: ${produtoOriginal.quantidadeEstoque}.`,
      };
    }

    setCarrinho((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          return {
            ...it,
            quantidade: novaQuantidade,
            subtotal: Number((novaQuantidade * it.valorUnitario).toFixed(2)),
          };
        }
        return it;
      })
    );

    return { sucesso: true };
  };

  const removerDoCarrinho = (index: number) => {
    setCarrinho((prev) => prev.filter((_, idx) => idx !== index));
  };

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  const totalCarrinho = useMemo(() => {
    return Number(carrinho.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));
  }, [carrinho]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  }, [carrinho]);

  // Fechamento da Venda através do Caso de Uso Clean Architecture
  const finalizarVenda = async (
    formaPagamento: FormaPagamento,
    valorRecebido?: number,
    desconto = 0
  ) => {
    if (!usuarioLogado) {
      return { sucesso: false, erro: 'Nenhum operador logado no caixa.' };
    }

    setProcessandoVenda(true);
    try {
      const entrada = {
        operadorId: usuarioLogado.id,
        operadorNome: usuarioLogado.nome,
        itens: carrinho.map((c) => ({ produtoId: c.produtoId, quantidade: c.quantidade })),
        formaPagamento,
        valorRecebido,
        desconto,
      };

      // Execução síncrona/atômica do Caso de Uso
      const resultado = await fecharVendaUseCase.executar(entrada);

      // Atualizar dados no estado do React
      await recarregarProdutos();
      await recarregarVendas();

      // Limpar carrinho e registrar cupom
      setCarrinho([]);
      setUltimoRecibo(resultado);

      return { sucesso: true, resultado };
    } catch (err: unknown) {
      if (err instanceof DominioException) {
        return { sucesso: false, erro: err.message };
      }
      if (err instanceof Error) {
        return { sucesso: false, erro: err.message };
      }
      return { sucesso: false, erro: 'Ocorreu um erro inesperado ao fechar a venda.' };
    } finally {
      setProcessandoVenda(false);
    }
  };

  const fecharModalRecibo = () => {
    setUltimoRecibo(null);
  };

  const resetarParaDadosIniciais = () => {
    localStorage.removeItem('pdv_produtos_v1');
    localStorage.removeItem('pdv_vendas_v1');
    localStorage.removeItem('pdv_usuarios_v1');
    localStorage.removeItem('pdv_lotes_v1');
    recarregarProdutos();
    recarregarLotes();
    recarregarVendas();
    recarregarUsuarios();
    setCarrinho([]);
  };

  return (
    <AppContext.Provider
      value={{
        usuarioLogado,
        telaAtiva,
        setTelaAtiva,
        login,
        logout,
        produtos,
        recarregarProdutos,
        salvarProduto,
        excluirProduto,
        lotes,
        recarregarLotes,
        salvarLote,
        excluirLote,
        vendas,
        recarregarVendas,
        usuarios,
        recarregarUsuarios,
        salvarUsuario,
        carrinho,
        adicionarAoCarrinho,
        removerDoCarrinho,
        atualizarQuantidadeItem,
        limparCarrinho,
        totalCarrinho,
        totalItensCarrinho,
        processandoVenda,
        finalizarVenda,
        ultimoRecibo,
        fecharModalRecibo,
        resetarParaDadosIniciais,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
