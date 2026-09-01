import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { CotacaoItemResult, User } from '../types';
import { OperatorLogo } from './OperatorLogo';
import { MultiplanLogo } from './MultiplanLogo';

interface CotacaoCartaoModalProps {
  item: CotacaoItemResult;
  cidade: string;
  uf: string;
  user: User;
  initialClientName?: string;
  onClose: () => void;
  onSaveCotacao?: (clientName: string) => void;
}

export const CotacaoCartaoModal: React.FC<CotacaoCartaoModalProps> = ({
  item,
  cidade,
  uf,
  user,
  initialClientName = '',
  onClose,
  onSaveCotacao
}) => {
  const [nomeCliente, setNomeCliente] = useState(initialClientName);
  const [nomeCorretor, setNomeCorretor] = useState(user.login || 'Corretor MultiPlan');
  const [telefoneCorretor, setTelefoneCorretor] = useState('(79) 9 8839-2446');
  const [taxaAdesaoFlyer, setTaxaAdesaoFlyer] = useState<number>(item.taxaAdesao ?? 35);
  const [logoStyle, setLogoStyle] = useState<'badge' | 'transparent' | 'circle'>('badge');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9); // 0.75, 0.9, 1.0
  const [showScrollHint, setShowScrollHint] = useState(true);
  const flyerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Monitora scroll para esconder a dica quando o corretor rolar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 40 && showScrollHint) {
      setShowScrollHint(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollHint(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Identidade de Cores e Logos por Operadora
  const getOperatorBrand = (operadora: string) => {
    const name = (operadora || '').toLowerCase();
    if (name.includes('hapvida')) {
      return {
        logoName: 'Hapvida',
        subtitle: 'SAÚDE & ODONTO',
        accentColor: '#e85d04',
        secondaryColor: '#002b66',
        isHapvida: true
      };
    } else if (name.includes('amil')) {
      return {
        logoName: 'Amil',
        subtitle: 'CUIDADO INTEGRAL',
        accentColor: '#00a884',
        secondaryColor: '#0c4a45',
        isHapvida: false
      };
    } else if (name.includes('bradesco')) {
      return {
        logoName: 'Bradesco Saúde',
        subtitle: 'EXCELÊNCIA & QUALIDADE',
        accentColor: '#cc092f',
        secondaryColor: '#5c0011',
        isHapvida: false
      };
    } else if (name.includes('sul')) {
      return {
        logoName: 'SulAmérica',
        subtitle: 'SAÚDE INTEGRAL',
        accentColor: '#ff7900',
        secondaryColor: '#0a2540',
        isHapvida: false
      };
    } else if (name.includes('unimed')) {
      return {
        logoName: 'Unimed',
        subtitle: 'CUIDAR DE VOCÊ',
        accentColor: '#00995d',
        secondaryColor: '#004d2e',
        isHapvida: false
      };
    }
    return {
      logoName: operadora.toUpperCase(),
      subtitle: 'PLANO DE SAÚDE',
      accentColor: '#e85d04',
      secondaryColor: '#001a54',
      isHapvida: false
    };
  };

  const brand = getOperatorBrand(item.operadora);

  // Cálculo de colunas comparativas para o flyer de vendas
  // Coluna 1: Com Coparticipação - Enfermaria e Apartamento
  // Coluna 2: Sem Coparticipação / Copart Parcial - Enfermaria e Apartamento
  const faixasAtivas = item.precosPorFaixa.filter(f => f.qtd > 0);

  // Se não houver faixas com vidas > 0 (caso raro), pega as 2 primeiras de exemplo
  const displayFaixas = faixasAtivas.length > 0 ? faixasAtivas : [
    { faixa: '00 a 18', qtd: 1, valorUnitarioSaude: 228.13, valorUnitarioOdonto: item.temOdonto ? 22.90 : 0, subtotal: 228.13 },
    { faixa: '24 a 28', qtd: 1, valorUnitarioSaude: 322.64, valorUnitarioOdonto: item.temOdonto ? 22.90 : 0, subtotal: 322.64 }
  ];

  // Cálculos de colunas comparativas (estimativas proporcionais caso o usuário queira ver ambos no flyer)
  const totalEnferCopart = displayFaixas.reduce((acc, f) => {
    const val = f.valorUnitarioSaude * (item.coparticipacao ? 1 : 0.88) + (item.temOdonto ? f.valorUnitarioOdonto : 0);
    return acc + (val * f.qtd);
  }, 0);

  const totalApartCopart = displayFaixas.reduce((acc, f) => {
    const val = (f.valorUnitarioSaude * (item.coparticipacao ? 1 : 0.88) * 1.20) + (item.temOdonto ? f.valorUnitarioOdonto : 0);
    return acc + (val * f.qtd);
  }, 0);

  const totalEnferSemCopart = displayFaixas.reduce((acc, f) => {
    const val = (f.valorUnitarioSaude * (item.coparticipacao ? 1.14 : 1)) + (item.temOdonto ? f.valorUnitarioOdonto : 0);
    return acc + (val * f.qtd);
  }, 0);

  const totalApartSemCopart = displayFaixas.reduce((acc, f) => {
    const val = (f.valorUnitarioSaude * (item.coparticipacao ? 1.14 : 1) * 1.20) + (item.temOdonto ? f.valorUnitarioOdonto : 0);
    return acc + (val * f.qtd);
  }, 0);

  // Função para Gerar e Baixar a Imagem PNG sem cortes
  const handleDownloadImage = async () => {
    if (!flyerRef.current) return;
    try {
      setIsGeneratingImage(true);

      // Aguarda fontes estarem carregadas para garantir ícones e tipografia
      if (document.fonts) {
        await document.fonts.ready;
      }

      const element = flyerRef.current;
      const originalScrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const offsetWidth = element.offsetWidth || 560;

      // Usamos html2canvas com clonagem segura e resolução 2.5x
      const canvas = await html2canvas(element, {
        scale: 2.5, // Alta resolução para WhatsApp/Telas Retina
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: offsetWidth,
        height: scrollHeight,
        windowWidth: 1280,
        windowHeight: scrollHeight + 400,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Remove qualquer restrição de altura ou overflow no documento clonado
          const clonedElement = clonedDoc.getElementById('flyer-cotacao-vendas');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.transform = 'none';
          }
          const scrollableParents = clonedDoc.querySelectorAll('[data-scroll-container="true"]');
          scrollableParents.forEach((el) => {
            (el as HTMLElement).style.overflow = 'visible';
            (el as HTMLElement).style.maxHeight = 'none';
            (el as HTMLElement).style.height = 'auto';
          });
        }
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeOpName = item.operadora.replace(/\s+/g, '_').toLowerCase();
      const safeCity = cidade.replace(/\s+/g, '_').toLowerCase();
      link.download = `Cotacao_${safeOpName}_${safeCity}_${Date.now().toString().slice(-4)}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Não foi possível gerar a imagem automaticamente. Tente novamente.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateWhatsAppText = () => {
    const totalVidas = item.precosPorFaixa.reduce((acc, f) => acc + f.qtd, 0);
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let text = `*MULTIPLAN CORRETORA DE SEGUROS*\n`;
    text += `📋 *COTAÇÃO OFICIAL DE PLANO DE SAÚDE*\n`;
    if (nomeCliente.trim()) {
      text += `👤 *Cliente:* ${nomeCliente.trim()}\n`;
    }
    text += `📍 *Praça:* ${cidade.toUpperCase()} - ${uf}\n`;
    text += `🏥 *Operadora:* ${item.operadora.toUpperCase()}\n`;
    text += `📑 *Plano:* ${item.planoNome}\n`;
    text += `🛏️ *Acomodação:* ${item.acomodacao}\n`;
    text += `⚖️ *Coparticipação:* ${item.coparticipacao ? 'Com Coparticipação' : 'Sem Coparticipação'}\n`;
    if (item.temOdonto) {
      text += `🦷 *Odontologia:* Incluso no pacote\n`;
    }
    text += `─────────────────────\n`;
    text += `👥 *VIDAS COTADAS (${totalVidas}):*\n`;

    item.precosPorFaixa.forEach(f => {
      if (f.qtd > 0) {
        text += `• ${f.faixa} anos: ${f.qtd}x R$ ${f.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
    });

    text += `─────────────────────\n`;
    text += `⭐ *TOTAL MENSAL ESTIMADO: R$ ${item.valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
    text += `📌 *Taxa de Adesão:* R$ ${(taxaAdesaoFlyer).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por contrato\n`;
    text += `─────────────────────\n`;
    text += `📞 *Consultor:* ${nomeCorretor}\n`;
    text += `📱 *WhatsApp:* ${telefoneCorretor}\n`;
    text += `📅 *Gerado em:* ${dataHoje}\n`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[96vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-[#001a54] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">image</span>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                <span>Flyer de Vendas em Imagem</span>
                <span className="text-[10px] bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Alta Resolução
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">Arte comercial pronta para baixar e enviar no WhatsApp do cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nome do Cliente (Opcional):
              </label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#001a54]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nome do Corretor:
              </label>
              <input
                type="text"
                value={nomeCorretor}
                onChange={(e) => setNomeCorretor(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#001a54]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                WhatsApp:
              </label>
              <input
                type="text"
                value={telefoneCorretor}
                onChange={(e) => setTelefoneCorretor(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#001a54]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                <span>Taxa de Adesão (R$):</span>
                <span className="text-[9px] text-blue-600 font-bold lowercase">do PDF / Plano</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxaAdesaoFlyer}
                  onChange={(e) => setTaxaAdesaoFlyer(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase px-1.5 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                  <span>Zoom:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(0.75)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    zoomLevel === 0.75 ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Ver tudo na tela sem rolar"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(0.9)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    zoomLevel === 0.9 ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Tamanho recomendado"
                >
                  90%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    zoomLevel === 1.0 ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Tamanho original 100%"
                >
                  100%
                </button>
              </div>

              {/* Logo Style Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase px-1.5 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">palette</span>
                  <span>Logo:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLogoStyle('badge')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    logoStyle === 'badge' ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Card Branco Corporativo (Recomendado oficial)"
                >
                  Cápsula Branca
                </button>
                <button
                  type="button"
                  onClick={() => setLogoStyle('transparent')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    logoStyle === 'transparent' ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Flor colorida + Texto Branco vazado"
                >
                  Vazada
                </button>
                <button
                  type="button"
                  onClick={() => setLogoStyle('circle')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    logoStyle === 'circle' ? 'bg-[#001a54] text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Selo Circular Laranja"
                >
                  Selo Laranja
                </button>
              </div>

              {/* Quick scroll buttons */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rolar até o topo do flyer"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  <span>Topo</span>
                </button>
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rolar até o rodapé com dados do corretor"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                  <span>Rodapé</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedText ? 'check' : 'content_copy'}
                </span>
                <span>{copiedText ? 'Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

              {/* BOTÃO GERAR IMAGEM (NO LUGAR DO BOTÃO PDF) */}
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGeneratingImage}
                className="px-5 py-2 bg-[#e85d04] hover:bg-[#d05303] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {isGeneratingImage ? 'progress_activity' : 'image'}
                </span>
                <span>{isGeneratingImage ? 'Gerando Imagem...' : 'Baixar Imagem (PNG)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTAINER DO FLYER COM BARRA DE ROLAGEM VISÍVEL E SUPORTE A ZOOM */}
        <div className="relative flex-1 bg-slate-200/90 overflow-hidden flex flex-col">
          {/* Dica flutuante de rolagem */}
          {showScrollHint && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
              <div className="bg-[#001a54] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border border-blue-400/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-orange-400">touch_app</span>
                <span>Role para baixo ou altere o zoom para ver toda a arte</span>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </div>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            data-scroll-container="true"
            className="p-3 sm:p-6 overflow-y-scroll flex-1 flex justify-center items-start"
            style={{
              scrollbarWidth: 'auto',
              scrollbarColor: '#001a54 #cbd5e1'
            }}
          >
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out',
                marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * 700)}px` : '20px'
              }}
            >
              <div
                ref={flyerRef}
                id="flyer-cotacao-vendas"
                className="w-full max-w-[560px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 text-slate-800 relative font-sans select-none"
                style={{ width: '560px', maxWidth: '100%', minWidth: '340px' }}
              >
            {/* 1. HEADER DO FLYER */}
            <div className="bg-[#002b66] text-white p-5 pb-4 relative overflow-hidden">
              {/* Marca d'água oficial MultiPlan ao fundo */}
              <div className="absolute right-2 -bottom-2 opacity-20 pointer-events-none flex items-center justify-end">
                <MultiplanLogo variant="white" showText={true} height={42} />
              </div>

              {/* Linha da Logo da Operadora Oficial */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center">
                  <OperatorLogo operadora={item.operadora} variant="white" styleType={logoStyle} height={38} />
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-xs">
                  {brand.subtitle}
                </div>
              </div>

              {/* Cidade em Destaque Central */}
              <div className="text-center my-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase font-sans">
                  {cidade}
                </h1>
                
                {/* Subtítulo com traços elegantes */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="h-[1.5px] w-8 bg-blue-300/40 rounded-full" />
                  <span className="text-[11px] sm:text-xs font-black tracking-wider text-blue-100 uppercase">
                    {item.planoNome.toUpperCase()} {item.temOdonto ? 'C/ ODONTO' : 'S/ ODONTO'}
                  </span>
                  <div className="h-[1.5px] w-8 bg-blue-300/40 rounded-full" />
                </div>
              </div>
            </div>

            {/* 2. TABELA COMPARATIVA DE PREÇOS */}
            <div className="p-3.5 sm:p-4 bg-white">
              <div className="grid grid-cols-12 gap-1.5 text-center text-xs">
                
                {/* Cabeçalho 1: NOSSO PLANO / FAIXA ETÁRIA */}
                <div className="col-span-3 flex flex-col">
                  <div className="bg-[#e85d04] text-white py-2 px-1 rounded-t-xl font-black text-[11px] uppercase tracking-tight shadow-2xs">
                    {item.planoNome.length > 12 ? 'PLANO' : item.planoNome}
                  </div>
                  <div className="bg-[#f8f9fa] border-x border-slate-200 py-1 text-[10px] font-bold text-slate-700 uppercase tracking-tighter">
                    Faixa Etária
                  </div>
                </div>

                {/* Cabeçalho 2: COM COPARTICIPAÇÃO */}
                <div className="col-span-5 flex flex-col">
                  <div className="bg-[#002b66] text-white py-2 px-1 rounded-t-xl font-black text-[11px] uppercase tracking-tight flex items-center justify-center gap-1 shadow-2xs">
                    <span>COM COPARTICIPAÇÃO</span>
                    <span className="material-symbols-outlined text-[13px] text-blue-200">handshake</span>
                  </div>
                  <div className="grid grid-cols-2 bg-[#f8f9fa] border-x border-slate-200 py-1 text-[9px] font-black text-slate-700 uppercase">
                    <span className="border-r border-slate-200">Enfer 13299</span>
                    <span>Apart 13298</span>
                  </div>
                </div>

                {/* Cabeçalho 3: COM COPART PARCIAL / SEM COPART */}
                <div className="col-span-4 flex flex-col">
                  <div className="bg-[#e5a00d] text-white py-2 px-1 rounded-t-xl font-black text-[10px] sm:text-[11px] uppercase tracking-tight flex items-center justify-center gap-1 shadow-2xs">
                    <span>COPART PARCIAL *</span>
                    <span className="material-symbols-outlined text-[13px] text-amber-100">verified_user</span>
                  </div>
                  <div className="grid grid-cols-2 bg-[#f8f9fa] border-x border-slate-200 py-1 text-[9px] font-black text-slate-700 uppercase">
                    <span className="border-r border-slate-200">Enfer 21057</span>
                    <span>Apart 21058</span>
                  </div>
                </div>
              </div>

              {/* LINHAS DE FAIXAS ETÁRIAS COTADAS */}
              <div className="divide-y divide-slate-200 border-x border-b border-slate-200 text-xs font-semibold">
                {displayFaixas.map((f, idx) => {
                  const valorBase = f.valorUnitarioSaude + (item.temOdonto ? f.valorUnitarioOdonto : 0);
                  const enferCop = valorBase * (item.coparticipacao ? 1 : 0.88);
                  const apartCop = enferCop * 1.20;
                  const enferParcial = valorBase * (item.coparticipacao ? 1.14 : 1);
                  const apartParcial = enferParcial * 1.20;

                  return (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 py-2.5 items-center hover:bg-slate-50">
                      {/* Faixa */}
                      <div className="col-span-3 text-center font-bold text-slate-900 text-xs">
                        {f.faixa}
                      </div>

                      {/* Com Copart (Enfer | Apart) */}
                      <div className="col-span-5 grid grid-cols-2 text-center text-xs font-bold text-slate-800">
                        <span className="border-r border-slate-100">
                          R$ {enferCop.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span>
                          R$ {apartCop.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Copart Parcial (Enfer | Apart) */}
                      <div className="col-span-4 grid grid-cols-2 text-center text-xs font-bold text-slate-800">
                        <span className="border-r border-slate-100">
                          R$ {enferParcial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span>
                          R$ {apartParcial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* LINHA DE TOTAL EM DESTAQUE */}
                <div className="grid grid-cols-12 gap-1.5 py-2 items-center text-xs font-black">
                  <div className="col-span-3 bg-[#e85d04] text-white py-2 text-center rounded-bl-xl uppercase tracking-wider text-xs">
                    TOTAL
                  </div>
                  <div className="col-span-5 grid grid-cols-2 bg-[#002b66] text-white py-2 text-center">
                    <span className="border-r border-blue-400/30">
                      R$ {totalEnferCopart.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>
                      R$ {totalApartCopart.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-4 grid grid-cols-2 bg-[#e5a00d] text-white py-2 text-center rounded-br-xl">
                    <span className="border-r border-amber-300/30">
                      R$ {totalEnferSemCopart.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>
                      R$ {totalApartSemCopart.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. BADGE DE TAXA DE ADESÃO */}
              <div className="my-3 flex justify-center">
                <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-blue-50 border border-blue-300 text-[#002b66] rounded-full shadow-2xs text-xs font-black">
                  <div className="w-5 h-5 rounded-full bg-[#002b66] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                  </div>
                  <span>** Adesão de R$ {taxaAdesaoFlyer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por contrato</span>
                </div>
              </div>

              {/* 4. SEÇÃO INFERIOR EM 2 COLUNAS: COPARTICIPAÇÃO E CARÊNCIAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Coluna Esquerda: COPARTICIPAÇÃO */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
                  {/* Cabeçalho */}
                  <div className="bg-[#002b66] text-white py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[15px] text-blue-200">local_hospital</span>
                    <span>Coparticipação</span>
                  </div>

                  {/* Tabela de Procedimentos */}
                  <div className="p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-blue-900 border-b border-slate-200 pb-1">
                      <span>Procedimentos</span>
                      <span>Copart Total</span>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Consultas Eletivas
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 35,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Consultas Urgência
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 32,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Exames Simples
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 40,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Exames Complexos
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 40,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Terapias Especiais
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 68,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Demais Terapias
                      </span>
                      <strong className="text-slate-900 font-bold">R$ 40,00</strong>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Internações
                      </span>
                      <span className="text-emerald-700 font-black">ISENTO</span>
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        Cirurgias
                      </span>
                      <span className="text-emerald-700 font-black">ISENTO</span>
                    </div>
                  </div>

                  {/* Bloco Laranja: Coparticipação somente em Terapias */}
                  <div className="bg-orange-500 text-white p-2 rounded-b-xl">
                    <div className="text-[10px] font-black uppercase flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-[13px]">favorite</span>
                      <span>Coparticipação Somente em Terapias</span>
                    </div>
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Terapias Especiais</span>
                        <strong className="font-mono font-bold">R$ 78,87</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Demais Terapias</span>
                        <strong className="font-mono font-bold">R$ 42,47</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: CARÊNCIAS DE SAÚDE */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
                  {/* Cabeçalho */}
                  <div className="bg-[#002b66] text-white py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[15px] text-blue-200">calendar_month</span>
                    <span>Carências de Saúde</span>
                  </div>

                  <div className="p-2 space-y-1.5 text-[10.5px]">
                    {/* 24 Hr */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        24<br /><span className="text-[9px] font-bold">Hr.</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">history_toggle_off</span>
                        <span>Urgência, Emergência e Acidentes Pessoais</span>
                      </div>
                    </div>

                    {/* 30 Dias */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        30<br /><span className="text-[9px] font-bold">Dias</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">stethoscope</span>
                        <span>Consultas Médicas, Exames Médicos Simples</span>
                      </div>
                    </div>

                    {/* 90 Dias */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        90<br /><span className="text-[9px] font-bold">Dias</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">visibility</span>
                        <span>Exames Cardiol., Exames Imagem, Ultrassonografia</span>
                      </div>
                    </div>

                    {/* 180 Dias */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        180<br /><span className="text-[9px] font-bold">Dias</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">domain</span>
                        <span>Cirurgias, Internações, Exames Alto Custo, Fisioterapia</span>
                      </div>
                    </div>

                    {/* 300 Dias */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        300<br /><span className="text-[9px] font-bold">Dias</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">child_care</span>
                        <span>Parto a Termo</span>
                      </div>
                    </div>

                    {/* 720 Dias */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="w-12 py-1 bg-white border border-blue-300 text-[#002b66] font-black text-center rounded-lg text-[10px] shrink-0 leading-tight">
                        720<br /><span className="text-[9px] font-bold">Dias</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 leading-tight">
                        <span className="material-symbols-outlined text-blue-600 text-sm shrink-0">verified_user</span>
                        <span>Doenças e Lesões Pré-Existentes</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 5. RODAPÉ DO CORRETOR COM AVATAR E WHATSAPP */}
            <div className="bg-[#002b66] text-white p-4 relative overflow-hidden flex items-center justify-between">
              {/* Detalhe Laranja Curvo à Direita */}
              <div className="absolute right-0 top-0 bottom-0 w-36 bg-[#e85d04] rounded-l-full pointer-events-none opacity-90" />
              
              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>

                <div>
                  <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                    {nomeCorretor}
                  </h4>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs mt-0.5">
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span>{telefoneCorretor}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-right pr-2 flex flex-col items-end">
                <MultiplanLogo variant="white" height={18} showText={true} />
                <span className="text-[9px] text-white/80 font-mono mt-0.5">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          
          <div className="flex items-center gap-2">
            {onSaveCotacao && (
              <button
                type="button"
                onClick={() => onSaveCotacao(nomeCliente)}
                className="px-4 py-2 bg-[#001a54] hover:bg-[#00133d] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">bookmark</span>
                Salvar no Histórico
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-5 py-2 bg-[#e85d04] hover:bg-[#d05303] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>{isGeneratingImage ? 'Gerando...' : 'Baixar Imagem PNG'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
