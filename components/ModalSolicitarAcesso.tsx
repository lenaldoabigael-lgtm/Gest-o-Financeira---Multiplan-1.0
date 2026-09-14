import React, { useState } from 'react';
import { User, UserAccessRequest } from '../types';
import { saveUserAccessRequest } from '../lib/supabase';

interface ModalSolicitarAcessoProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRequestSubmitted?: (newRequest: UserAccessRequest) => void;
}

export const ModalSolicitarAcesso: React.FC<ModalSolicitarAcessoProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRequestSubmitted
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargoSugerido, setCargoSugerido] = useState('Analista Sênior');
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nome.trim() || !email.trim()) {
      setErrorMsg('Por favor, informe ao menos o Nome Completo e o E-mail Corporativo.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }

    if (!justificativa.trim()) {
      setErrorMsg('Por favor, informe uma breve justificativa para a solicitação de acesso.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newRequest: UserAccessRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        cargoSugerido: cargoSugerido,
        justificativa: justificativa.trim(),
        solicitanteLogin: currentUser.login || 'Colaborador',
        solicitanteEmail: currentUser.email || '',
        status: 'PENDENTE',
        created_at: new Date().toISOString()
      };

      await saveUserAccessRequest(newRequest);

      if (onRequestSubmitted) {
        onRequestSubmitted(newRequest);
      }

      setSuccessMsg(`Solicitação para "${nome.trim()}" enviada com sucesso! O Administrador receberá a notificação para aprovação e liberação do acesso.`);
      
      setTimeout(() => {
        setNome('');
        setEmail('');
        setTelefone('');
        setCargoSugerido('Analista Sênior');
        setJustificativa('');
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao enviar a solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#001a54] to-[#002b66] p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-xl text-orange-400">person_add</span>
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Solicitar Novo Acesso / Usuário
              </h3>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Envie os dados do colaborador para validação e liberação do Admin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* SOLICITANTE BADGE */}
        <div className="bg-slate-50 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500 font-semibold">
            <span className="material-symbols-outlined text-sm text-gray-400">badge</span>
            <span>Solicitante:</span>
            <span className="text-[#001a54] font-black">{currentUser.login}</span>
            {currentUser.cargo && (
              <span className="text-gray-400 font-normal">({currentUser.cargo})</span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-md">
            Fluxo Interno
          </span>
        </div>

        {/* BODY / FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-red-600 text-base shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Nome do Colaborador *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Hellen Kelma"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                placeholder="hellen.kelma@multiplan.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(81) 98888-7777"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Função Sugerida
              </label>
              <select
                value={cargoSugerido}
                onChange={e => setCargoSugerido(e.target.value)}
                className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54]"
              >
                <option value="Analista Sênior">Analista Sênior</option>
                <option value="Gerente Geral & Financeiro">Gerente Geral & Financeiro</option>
                <option value="Gerente Financeiro">Gerente Financeiro</option>
                <option value="Corretor Sênior">Corretor Sênior</option>
                <option value="Assistente Comercial">Assistente Comercial</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Justificativa / Motivo do Acesso *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Novo colaborador contratado para o departamento financeiro da matriz..."
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] resize-none"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#e85d04] hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Enviar Solicitação ao Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
