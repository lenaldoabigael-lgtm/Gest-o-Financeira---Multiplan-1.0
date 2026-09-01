import React from 'react';

interface MultiplanLogoProps {
  variant?: 'white' | 'blue' | 'colored';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number;
  className?: string;
}

export const MultiplanLogo: React.FC<MultiplanLogoProps> = ({
  variant = 'white',
  showText = true,
  size = 'md',
  height,
  className = ''
}) => {
  const iconColor = variant === 'blue' ? '#0066cc' : '#ffffff';
  const textColor = variant === 'blue' ? '#002b66' : '#ffffff';
  const shadowColor = variant === 'blue' ? '#004c99' : '#d0e4ff';

  // Sizing
  let h = height || (size === 'sm' ? 24 : size === 'lg' ? 44 : size === 'xl' ? 56 : 32);

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* MULTIPLAN RIBBON 'M' ICON */}
      <svg
        height={h}
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Shadow / Depth layer behind folds */}
        <path
          d="M34 76C24 76 16 68 16 58C16 48 24 38 34 38C44 38 52 48 58 58L68 76C74 84 84 88 94 88C108 88 120 78 124 64L108 60C104 68 98 72 90 72C84 72 78 68 74 62L62 42C54 28 42 22 28 22C12 22 0 36 0 54C0 74 16 90 36 90H50L44 76H34Z"
          fill={shadowColor}
          opacity="0.4"
        />
        {/* Left Arch Ribbon */}
        <path
          d="M24 78C13 78 4 69 4 56C4 43 14 32 28 32C40 32 49 41 55 52L62 65C68 76 77 82 88 82C99 82 108 76 114 65L126 72C118 87 104 96 88 96C72 96 59 88 50 74L44 63C40 55 34 46 26 46C19 46 14 51 14 58C14 65 19 70 26 70H38L32 84H24V78Z"
          fill={iconColor}
        />
        {/* Main Ribbon Flow Waves */}
        <path
          d="M28 20C42 20 54 27 63 42L72 57C78 67 85 72 94 72C101 72 106 67 108 60L124 64C120 78 108 88 94 88C82 88 72 82 64 70L54 53C47 41 40 36 30 36C20 36 14 43 14 52C14 55 15 58 17 61L5 67C2 62 0 56 0 50C0 32 14 20 28 20Z"
          fill={iconColor}
        />
        {/* Top Arch Right */}
        <path
          d="M74 20C88 20 100 27 109 42L124 68C128 75 133 78 138 78H140V92H134C124 92 116 86 110 76L97 53C91 43 85 36 76 36C68 36 62 41 58 48L46 40C52 28 62 20 74 20Z"
          fill={iconColor}
        />
        {/* Fold Highlights */}
        <path
          d="M48 44C54 36 63 30 74 30C85 30 94 36 100 44L88 52C85 47 80 44 74 44C68 44 63 47 60 52L48 44Z"
          fill={variant === 'blue' ? '#ffffff' : '#e6f0ff'}
          opacity="0.8"
        />
      </svg>

      {/* MULTIPLAN TYPOGRAPHY */}
      {showText && (
        <div className="flex items-center tracking-tight font-black font-sans leading-none">
          <span
            style={{ color: textColor, fontSize: `${h * 0.72}px` }}
            className="tracking-tight uppercase font-black"
          >
            MULTI<span className="ml-1 tracking-normal">PLAN</span>
          </span>
        </div>
      )}
    </div>
  );
};
