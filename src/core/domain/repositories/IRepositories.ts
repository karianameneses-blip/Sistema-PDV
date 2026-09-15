import { Produto, Venda, Usuario, LoteValidade } from '../../../types';

export interface IProdutoRepository {
  buscarPorId(id: string): Promise<Produto | null>;
  buscarPorCodigoOuNome(termo: string): Promise<Produto[]>;
  listarTodos(): Promise<Produto[]>;
  salvar(produto: Produto): Promise<void>;
  atualizar(produto: Produto): Promise<void>;
  excluir(id: string): Promise<void>;
  /**
   * Operação atômica transacional para dedução de saldo de estoque.
   * Se qualquer item violar saldo disponível ou concorrência, deve falhar sem efeito colateral.
   */
  deduzirEstoqueTransacional(itensBaixa: { produtoId: string; quantidade: number }[]): Promise<void>;
}

export interface IVendaRepository {
  salvar(venda: Venda): Promise<void>;
  listarVendas(periodo?: { inicio: string; fim: string }): Promise<Venda[]>;
  obterUltimoNumeroCupom(): Promise<number>;
}

export interface IUsuarioRepository {
  buscarPorLogin(login: string): Promise<Usuario | null>;
  listarTodos(): Promise<Usuario[]>;
  salvar(usuario: Usuario): Promise<void>;
  atualizar(usuario: Usuario): Promise<void>;
}

export interface ILoteRepository {
  listarPorProduto(produtoId: string): Promise<LoteValidade[]>;
  listarTodos(): Promise<LoteValidade[]>;
  salvar(lote: LoteValidade): Promise<void>;
  excluir(id: string): Promise<void>;
}
