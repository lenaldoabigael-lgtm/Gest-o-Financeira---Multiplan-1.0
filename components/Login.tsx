
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (emailOrLogin: string, pass: string) => Promise<boolean>;
  onRegister: (login: string, email: string, pass: string) => Promise<boolean>;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, error }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        const success = await onRegister(login, email, senha);
        if (success) {
          setIsRegistering(false);
          setSenha('');
        }
      } else {
        const success = await onLogin(email || login, senha);
        if (!success) {
          setLocalError('E-mail ou senha incorretos, ou conta pendente de aprovação.');
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Ocorreu um erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans p-4">
      <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-[420px] transition-all duration-500 border-t-8 border-[#1e3a8a]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter">MULTIPLAN</h1>
          <div className="w-12 h-1 bg-[#1e3a8a] mx-auto rounded mt-1"></div>
        </div>
        
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-[#1e3a8a] mb-1">
            {isRegistering ? 'Solicitar Acesso' : 'Bem Vindo'}
          </h2>
          <p className="text-xs font-medium text-slate-400">
            {isRegistering ? 'Preencha os dados para solicitar seu acesso.' : 'Entre com suas credenciais abaixo.'}
          </p>
        </div>

        {(localError || error) && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-semibold text-center">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 group">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="login">
                 {isRegistering ? 'Nome de Usuário' : 'E-mail ou Usuário'}
               </label>
            </div>
            <input
              id="login"
              type={isRegistering ? "text" : "text"}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-100 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1e3a8a] transition-all placeholder:text-slate-200"
              placeholder={isRegistering ? "Seu Nome" : "email@multiplan.com"}
              required
            />
          </div>

          {isRegistering && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-100 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1e3a8a] transition-all placeholder:text-slate-200"
                placeholder="email@multiplan.com"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-100 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1e3a8a] transition-all placeholder:text-slate-200"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a8a] hover:bg-[#152a65] text-white font-black py-4 px-4 rounded-lg transition-all duration-300 uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            {isRegistering ? 'Enviar Solicitação' : 'Entrar'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] font-black text-[#1e3a8a] hover:text-[#152a65] transition-colors uppercase tracking-[0.1em] flex items-center justify-center gap-2 mx-auto"
          >
            {isRegistering ? (
               <>TENHO ACESSO? <span className="text-orange-500">ENTRAR AGORA</span></>
            ) : (
               <>NÃO TEM ACESSO? <span className="text-orange-500">SOLICITAR AGORA</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
