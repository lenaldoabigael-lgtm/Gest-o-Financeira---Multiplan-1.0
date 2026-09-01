
import React, { useState } from 'react';
import { MultiplanLogo } from './MultiplanLogo';

interface LoginProps {
  onLogin: (emailOrLogin: string, pass: string) => Promise<boolean>;
  onRegister: (login: string, email: string, pass: string) => Promise<boolean>;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, error }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        const success = await onRegister(identifier.trim(), email.trim(), senha.trim());
        if (success) {
          setIsRegistering(false);
          setSenha('');
        }
      } else {
        const success = await onLogin(identifier.trim(), senha.trim());
        if (!success) {
          setLocalError('E-mail/usuário ou senha incorretos, ou conta pendente de aprovação.');
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
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-[440px] transition-all duration-500 border-t-8 border-[#001a54]">
        <div className="flex flex-col items-center justify-center mb-6">
          <MultiplanLogo variant="blue" height={42} showText={true} />
          <div className="w-16 h-1 bg-[#001a54] rounded-full mt-3"></div>
        </div>
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-[#001a54] mb-1">
            {isRegistering ? 'Solicitar Acesso' : 'Bem Vindo'}
          </h2>
          <p className="text-xs font-medium text-slate-400">
            {isRegistering ? 'Preencha os dados para solicitar seu acesso ao sistema.' : 'Entre com suas credenciais abaixo.'}
          </p>
        </div>

        {(localError || error) && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-center leading-relaxed">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 group">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider" htmlFor="identifier">
              {isRegistering ? 'Nome de Usuário / Login' : 'E-mail ou Usuário'}
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#001a54] focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder={isRegistering ? "Ex: seu.nome" : "admin ou seu@email.com"}
              required
            />
          </div>

          {isRegistering && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider" htmlFor="email">
                E-mail Corporativo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#001a54] focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                placeholder="email@multiplan.com"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider" htmlFor="senha">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-blue-900 hover:text-blue-700 transition-colors cursor-pointer select-none"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className="relative">
              <input
                id="senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#001a54] focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#001a54] hover:bg-[#001138] text-white font-extrabold py-3.5 px-4 rounded-xl transition-all duration-300 uppercase text-xs tracking-[0.15em] shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Conectando...</span>
              </>
            ) : (
              <span>{isRegistering ? 'Enviar Solicitação' : 'Entrar no Sistema'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center flex flex-col items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setLocalError(null);
            }}
            className="text-[11px] font-black text-[#001a54] hover:text-[#002b66] transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isRegistering ? (
               <>JÁ TEM CONTA? <span className="text-orange-600 underline">ENTRAR AGORA</span></>
            ) : (
               <>NÃO TEM ACESSO? <span className="text-orange-600 underline">SOLICITAR CADASTRO</span></>
            )}
          </button>

          {!isRegistering && (
            <div className="w-full p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/80 text-[11px] text-blue-900/80 flex items-center justify-between">
              <span className="font-medium">Acesso Master Padrão:</span>
              <span className="font-mono font-bold text-[#001a54] bg-white px-2 py-0.5 rounded border border-blue-200">
                admin / Davi2017
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
