import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PapelUsuario, Usuario } from '../../types';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

export const GestaoUsuarios: React.FC = () => {
  const { usuarios, salvarUsuario, usuarioLogado } = useApp();

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Form Novo Usuário
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('OPERADOR_CAIXA');
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Form Alterar Senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const abrirModalNovo = () => {
    setNome('');
    setLogin('');
    setSenha('');
    setPapel('OPERADOR_CAIXA');
    setErroForm(null);
    setModalNovoAberto(true);
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nome.trim() || !login.trim() || !senha.trim()) {
      setErroForm('Todos os campos são obrigatórios.');
      return;
    }

    const jaExiste = usuarios.some((u) => u.login.toLowerCase() === login.trim().toLowerCase());
    if (jaExiste) {
      setErroForm('Já existe um usuário cadastrado com este login.');
      return;
    }

    const novo: Usuario = {
      id: `usr_${Date.now()}`,
      nome: nome.trim(),
      login: login.trim().toLowerCase(),
      senhaHash: senha.trim(),
      papel,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    await salvarUsuario(novo);
    setModalNovoAberto(false);
  };

  const abrirModalAlterarSenha = (user: Usuario) => {
    setUsuarioSelecionado(user);
    setNovaSenha('');
    setConfirmarSenha('');
    setErroSenha(null);
    setModalSenhaAberto(true);
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(null);

    if (!novaSenha.trim()) {
      setErroSenha('Informe a nova senha.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha('A confirmação de senha não coincide.');
      return;
    }

    if (!usuarioSelecionado) return;

    const atualizado: Usuario = {
      ...usuarioSelecionado,
      senhaHash: novaSenha.trim(),
    };

    await salvarUsuario(atualizado);
    setModalSenhaAberto(false);
  };

  const alternarStatusAtivo = async (user: Usuario) => {
    if (user.id === usuarioLogado?.id) {
      alert('Você não pode desativar o usuário atualmente conectado.');
      return;
    }

    const atualizado: Usuario = {
      ...user,
      ativo: !user.ativo,
    };
    await salvarUsuario(atualizado);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-5 h-5 text-blue-600" />
            CONTROLE DE ACESSO & GESTÃO DE OPERADORES
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de credenciais, permissões de frente de caixa e gerência.
          </p>
        </div>

        <button
          id="btn-cadastrar-usuario"
          type="button"
          onClick={abrirModalNovo}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-3">Nome do Colaborador</th>
                <th className="py-3 px-3">Login de Acesso</th>
                <th className="py-3 px-3">Nível de Permissão (Role)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Ações de Segurança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const isAdmin = u.papel === 'ADMINISTRADOR';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 text-sm">{u.nome}</p>
                      {u.id === usuarioLogado?.id && (
                        <span className="text-[10px] text-blue-700 font-bold font-mono uppercase tracking-wider">(Sessão Atual)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-blue-700 font-bold font-mono">
                      @{u.login}
                    </td>
                    <td className="py-3 px-3">
                      {isAdmin ? (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1 uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Administrador / Gerente
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 uppercase tracking-wider">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Operador de Caixa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => alternarStatusAtivo(u)}
                        disabled={u.id === usuarioLogado?.id}
                        className="cursor-pointer"
                        title="Clique para alternar status"
                      >
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> ATIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                            <XCircle className="w-4 h-4" /> INATIVO
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => abrirModalAlterarSenha(u)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>Alterar Senha</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                CADASTRAR NOVO USUÁRIO / COLABORADOR
              </h3>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovo} className="p-5 space-y-4">
              {erroForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-bold">
                  {erroForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login de Acesso *
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Ex: beatriz"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Senha Inicial *
                </label>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Perfil de Permissão (Role) *
                </label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="OPERADOR_CAIXA">Operador de Caixa (Acesso apenas ao PDV)</option>
                  <option value="ADMINISTRADOR">Administrador (Acesso completo à Retaguarda e PDV)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alterar Senha */}
      {modalSenhaAberto && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Alterar Senha de {usuarioSelecionado.nome}
              </h3>
              <button
                onClick={() => setModalSenhaAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaSenha} className="p-5 space-y-4">
              {erroSenha && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-bold">
                  {erroSenha}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSenhaAberto(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold uppercase cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
