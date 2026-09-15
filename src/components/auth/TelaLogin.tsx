import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, ShoppingBag, ShieldCheck, ArrowRight, Store } from 'lucide-react';

export const TelaLogin: React.FC = () => {
  const { login } = useApp();
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!loginInput || !senhaInput) {
      setErro('Preencha o login e a senha.');
      return;
    }

    const res = login(loginInput, senhaInput);
    if (!res.sucesso) {
      setErro(res.mensagem || 'Falha ao autenticar.');
    }
  };

  const preencherCredenciais = (usuario: string, senha: string) => {
    setLoginInput(usuario);
    setSenhaInput(senha);
    setErro(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4 selection:bg-blue-500/20">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-8 relative overflow-hidden">
        {/* Faixa superior corporativa */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>

        {/* Header do Sistema */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-3.5 shadow-sm">
            <Store className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PDV & RETAGUARDA</h1>
          </div>
          <p className="text-xs text-slate-500 font-normal">Sistema Corporativo Integrado de Gestão Comercial</p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Usuário / Matrícula
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-input"
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Ex: admin ou caixa"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chave de Acesso (Senha)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="senha-input"
                type="password"
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition shadow-sm"
              />
            </div>
          </div>

          <button
            id="btn-entrar"
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition duration-150 cursor-pointer"
          >
            <span>Autenticar Operador</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Atalhos Rápidos para Teste de Perfis */}
        <div className="mt-7 pt-5 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2.5 text-center">
            Perfis de Demonstração para Teste:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => preencherCredenciais('caixa', 'caixa123')}
              className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-0.5 group-hover:text-blue-600">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Operador</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">caixa / caixa123</p>
            </button>

            <button
              type="button"
              onClick={() => preencherCredenciais('admin', 'admin123')}
              className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-0.5 group-hover:text-blue-600">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Administrador</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">admin / admin123</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
