import React from 'react';
import { getOperatorLogo, LOGO_BASE64 } from '../src/logo';

export type LogoStyle = 'badge' | 'transparent' | 'circle';

interface OperatorLogoProps {
  operadora: string;
  variant?: 'white' | 'colored' | 'banner';
  styleType?: LogoStyle; // 'badge' = pílula branca corporativa, 'transparent' = sobre fundo escuro/gradiente, 'circle' = selo circular
  className?: string;
  height?: number;
}

export const OperatorLogo: React.FC<OperatorLogoProps> = ({
  operadora,
  variant = 'white',
  styleType = 'badge',
  className = '',
  height = 36,
}) => {
  const logoSrc = getOperatorLogo(operadora);

  if (logoSrc) {
    // 1. Pílula Branca Corporativa Oficial (rounded-full)
    if (styleType === 'badge') {
      return (
        <div
          className={`inline-flex items-center justify-center px-3.5 py-1 bg-white rounded-full shadow-xs border border-slate-100/90 select-none ${className}`}
          style={{ height: height + 10 }}
        >
          <img
            src={logoSrc}
            alt={operadora}
            style={{
              height: `${height}px`,
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              maxWidth: '100%',
            }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    // 2. Selo Circular
    if (styleType === 'circle') {
      return (
        <div className={`inline-flex items-center gap-2 select-none ${className}`} style={{ height: `${height}px` }}>
          <div
            className="inline-flex items-center justify-center bg-white rounded-full p-1.5 shadow-xs shrink-0"
            style={{ width: `${height + 6}px`, height: `${height + 6}px` }}
          >
            <img
              src={logoSrc}
              alt={operadora}
              style={{
                height: `${height * 0.75}px`,
                width: `${height * 0.75}px`,
                objectFit: 'contain',
              }}
            />
          </div>
          <span className="text-sm sm:text-base font-black italic tracking-tight text-white font-sans uppercase">
            {operadora}
          </span>
        </div>
      );
    }

    // 3. Fundo Transparente
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`} style={{ height: `${height}px` }}>
        <img
          src={logoSrc}
          alt={operadora}
          style={{
            height: `${height}px`,
            objectFit: 'contain',
            filter: variant === 'white' && !logoSrc.includes('svg') ? 'brightness(0) invert(1)' : undefined,
          }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback padrão se não houver logo específica cadastrada
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} style={{ height: `${height}px` }}>
      <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
        <span className="material-symbols-outlined text-base">health_and_safety</span>
      </div>
      <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
        {operadora}
      </span>
    </div>
  );
};
