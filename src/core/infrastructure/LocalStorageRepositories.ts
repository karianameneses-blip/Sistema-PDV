import {
  ILoteRepository,
  IProdutoRepository,
  IUsuarioRepository,
  IVendaRepository,
} from '../domain/repositories/IRepositories';
import { LoteValidade, Produto, Usuario, Venda } from '../../types';
import {
  LOTES_INICIAIS,
  PRODUTOS_INICIAIS,
  USUARIOS_INICIAIS,
  VENDAS_INICIAIS,
} from './database/InitialData';
import {
  ProdutoInativoException,
  ProdutoNaoEncontradoException,
  SaldoEstoqueInsuficienteException,
} from '../domain/exceptions/DominioExceptions';

const CHAVE_PRODUTOS = 'pdv_produtos_v1';
const CHAVE_VENDAS = 'pdv_vendas_v1';
const CHAVE_USUARIOS = 'pdv_usuarios_v1';
const CHAVE_LOTES = 'pdv_lotes_v1';

export class LocalStorageProdutoRepository implements IProdutoRepository {
  private obterProdutos(): Produto[] {
    const dados = localStorage.getItem(CHAVE_PRODUTOS);
    if (!dados) {
      localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(PRODUTOS_INICIAIS));
      return PRODUTOS_INICIAIS;
    }
    try {
      return JSON.parse(dados);
    } catch {
      return PRODUTOS_INICIAIS;
    }
  }

  private salvarProdutos(produtos: Produto[]): void {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
  }

  public async buscarPorId(id: string): Promise<Produto | null> {
    const produtos = this.obterProdutos();
    return produtos.find((p) => p.id === id) || null;
  }

  public async buscarPorCodigoOuNome(termo: string): Promise<Produto[]> {
    const termoLimpo = termo.trim().toLowerCase();
    if (!termoLimpo) return [];

    const produtos = this.obterProdutos();
    return produtos.filter(
      (p) =>
        p.ativo &&
        (p.codigoInterno.toLowerCase().includes(termoLimpo) ||
          p.nome.toLowerCase().includes(termoLimpo) ||
          p.categoria.toLowerCase().includes(termoLimpo))
    );
  }

  public async listarTodos(): Promise<Produto[]> {
    return this.obterProdutos();
  }

  public async salvar(produto: Produto): Promise<void> {
    const produtos = this.obterProdutos();
    produtos.push(produto);
    this.salvarProdutos(produtos);
  }

  public async atualizar(produto: Produto): Promise<void> {
    const produtos = this.obterProdutos();
    const index = produtos.findIndex((p) => p.id === produto.id);
    if (index >= 0) {
      produtos[index] = { ...produto, atualizadoEm: new Date().toISOString() };
      this.salvarProdutos(produtos);
    }
  }

  public async excluir(id: string): Promise<void> {
    const produtos = this.obterProdutos();
    const filtrados = produtos.filter((p) => p.id !== id);
    this.salvarProdutos(filtrados);
  }

  /**
   * Operação Atômica com Semântica de Transação (ACID)
   * 1. Fase de Verificação (Bloqueio / Validação de Saldo de Todos os Itens)
   * 2. Fase de Atualização (Commit apenas se todos forem válidos)
   */
  public async deduzirEstoqueTransacional(
    itensBaixa: { produtoId: string; quantidade: number }[]
  ): Promise<void> {
    const produtos = this.obterProdutos();

    // 1. Fase de Validação Isolada
    for (const item of itensBaixa) {
      const prod = produtos.find((p) => p.id === item.produtoId);
      if (!prod) {
        throw new ProdutoNaoEncontradoException(item.produtoId);
      }
      if (!prod.ativo) {
        throw new ProdutoInativoException(prod.nome);
      }
      if (prod.quantidadeEstoque < item.quantidade) {
        throw new SaldoEstoqueInsuficienteException(
          prod.nome,
          item.quantidade,
          prod.quantidadeEstoque
        );
      }
    }

    // 2. Fase de Aplicação Atômica
    for (const item of itensBaixa) {
      const index = produtos.findIndex((p) => p.id === item.produtoId);
      if (index >= 0) {
        produtos[index].quantidadeEstoque = Number(
          (produtos[index].quantidadeEstoque - item.quantidade).toFixed(3)
        );
        produtos[index].atualizadoEm = new Date().toISOString();
      }
    }

    this.salvarProdutos(produtos);
  }
}

export class LocalStorageVendaRepository implements IVendaRepository {
  private obterVendas(): Venda[] {
    const dados = localStorage.getItem(CHAVE_VENDAS);
    if (!dados) {
      localStorage.setItem(CHAVE_VENDAS, JSON.stringify(VENDAS_INICIAIS));
      return VENDAS_INICIAIS;
    }
    try {
      return JSON.parse(dados);
    } catch {
      return VENDAS_INICIAIS;
    }
  }

  public async salvar(venda: Venda): Promise<void> {
    const vendas = this.obterVendas();
    vendas.unshift(venda); // Inserir no topo
    localStorage.setItem(CHAVE_VENDAS, JSON.stringify(vendas));
  }

  public async listarVendas(periodo?: { inicio: string; fim: string }): Promise<Venda[]> {
    const vendas = this.obterVendas();
    if (!periodo) return vendas;

    const dataInicio = new Date(periodo.inicio).getTime();
    const dataFim = new Date(periodo.fim).getTime();

    return vendas.filter((v) => {
      const t = new Date(v.dataHora).getTime();
      return t >= dataInicio && t <= dataFim;
    });
  }

  public async obterUltimoNumeroCupom(): Promise<number> {
    const vendas = this.obterVendas();
    if (vendas.length === 0) return 1000;
    const max = Math.max(...vendas.map((v) => v.numeroCupom || 1000));
    return max;
  }
}

export class LocalStorageUsuarioRepository implements IUsuarioRepository {
  private obterUsuarios(): Usuario[] {
    const dados = localStorage.getItem(CHAVE_USUARIOS);
    if (!dados) {
      localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(USUARIOS_INICIAIS));
      return USUARIOS_INICIAIS;
    }
    try {
      return JSON.parse(dados);
    } catch {
      return USUARIOS_INICIAIS;
    }
  }

  private salvarUsuarios(usuarios: Usuario[]): void {
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
  }

  public async buscarPorLogin(login: string): Promise<Usuario | null> {
    const usuarios = this.obterUsuarios();
    return (
      usuarios.find(
        (u) => u.login.toLowerCase() === login.toLowerCase() && u.ativo
      ) || null
    );
  }

  public async listarTodos(): Promise<Usuario[]> {
    return this.obterUsuarios();
  }

  public async salvar(usuario: Usuario): Promise<void> {
    const usuarios = this.obterUsuarios();
    usuarios.push(usuario);
    this.salvarUsuarios(usuarios);
  }

  public async atualizar(usuario: Usuario): Promise<void> {
    const usuarios = this.obterUsuarios();
    const index = usuarios.findIndex((u) => u.id === usuario.id);
    if (index >= 0) {
      usuarios[index] = usuario;
      this.salvarUsuarios(usuarios);
    }
  }
}

export class LocalStorageLoteRepository implements ILoteRepository {
  private obterLotes(): LoteValidade[] {
    const dados = localStorage.getItem(CHAVE_LOTES);
    if (!dados) {
      localStorage.setItem(CHAVE_LOTES, JSON.stringify(LOTES_INICIAIS));
      return LOTES_INICIAIS;
    }
    try {
      return JSON.parse(dados);
    } catch {
      return LOTES_INICIAIS;
    }
  }

  private salvarLotes(lotes: LoteValidade[]): void {
    localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes));
  }

  public async listarPorProduto(produtoId: string): Promise<LoteValidade[]> {
    const lotes = this.obterLotes();
    return lotes.filter((l) => l.produtoId === produtoId);
  }

  public async listarTodos(): Promise<LoteValidade[]> {
    return this.obterLotes();
  }

  public async salvar(lote: LoteValidade): Promise<void> {
    const lotes = this.obterLotes();
    lotes.push(lote);
    this.salvarLotes(lotes);
  }

  public async excluir(id: string): Promise<void> {
    const lotes = this.obterLotes();
    const filtrados = lotes.filter((l) => l.id !== id);
    this.salvarLotes(filtrados);
  }
}
