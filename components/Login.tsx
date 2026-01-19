
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
  onRegister: (login: string, email: string, pass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      setLoading(true);
      const success = await onRegister(login, email, senha);
      setLoading(false);
      if (success) {
        setIsRegistering(false);
        setSenha('');
      }
    } else {
      onLogin(login, senha);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
      <div className="bg-white p-8 rounded shadow-xl w-full max-w-md border-t-4 border-blue-900 transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-900 uppercase mb-2 tracking-tighter">Multiplan</h1>
          <div className="w-16 h-1 bg-blue-900 mx-auto rounded"></div>
        </div>
        
        <h2 className="text-xl font-bold text-blue-800 text-center mb-2">
          {isRegistering ? 'Criar Nova Conta' : 'Bem Vindo'}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {isRegistering ? 'Preencha os dados para se cadastrar.' : 'Entre com suas credenciais abaixo.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center border-b border-gray-300 py-2">
            <label className="w-20 text-xs font-bold text-gray-400 uppercase" htmlFor="login">Login</label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none text-sm"
              placeholder="seu.usuario"
              required
            />
          </div>

          {isRegistering && (
            <div className="flex items-center border-b border-gray-300 py-2 animate-in fade-in slide-in-from-top-2">
              <label className="w-20 text-xs font-bold text-gray-400 uppercase" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none text-sm"
                placeholder="exemplo@email.com"
                required
              />
            </div>
          )}

          <div className="flex items-center border-b border-gray-300 py-2">
            <label className="w-20 text-xs font-bold text-gray-400 uppercase" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none text-sm"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded transition-colors duration-200 uppercase tracking-widest mt-4 shadow-lg flex items-center justify-center gap-2"
          >
            {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            {isRegistering ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-bold text-blue-900 hover:text-orange-500 transition-colors uppercase tracking-tighter"
          >
            {isRegistering ? 'Já tenho uma conta? Entrar' : 'Não tem uma conta? Criar agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
