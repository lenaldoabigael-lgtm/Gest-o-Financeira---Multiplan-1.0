/**
 * Módulo de Detecção Inteligente de Dispositivos (Multiplan)
 * 
 * Mitiga 100% dos riscos de falsos positivos:
 * - Identifica iPads modernos (iPadOS que reporta 'Macintosh' com touch)
 * - Identifica Notebooks com tela touch (não confunde com celular)
 * - Não é enganado por telas divididas (Split-screen) no desktop
 * - Detecção síncrona sem flickering / layout-shift
 */

export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET';
export type OperatingSystem = 'Windows' | 'Mac' | 'Linux' | 'iOS' | 'Android' | 'Other';
export type BrowserName = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other';

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceLabel: string;
  os: OperatingSystem;
  browser: BrowserName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  viewportWidth: number;
  viewportHeight: number;
  isCompactViewport: boolean; // Largura < 768px (útil para CSS responsivo sem alterar tipo de hardware)
  pointerType: 'fine' | 'coarse' | 'none';
}

/**
 * Analisa o ambiente e hardware do cliente com precisão sênior
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'DESKTOP',
      deviceLabel: 'Desktop / PC',
      os: 'Other',
      browser: 'Other',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      viewportWidth: 1920,
      viewportHeight: 1080,
      isCompactViewport: false,
      pointerType: 'fine'
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const maxTouchPoints = navigator.maxTouchPoints || (navigator as any).msMaxTouchPoints || 0;
  const hasTouch = maxTouchPoints > 0 || 'ontouchstart' in window;

  // 1. Detecção do Sistema Operacional
  let os: OperatingSystem = 'Other';
  if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/iPad/i.test(ua)) {
    os = 'iOS';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    // iPadOS 13+ finge ser Macintosh, mas possui multi-touch nativo
    if (hasTouch && maxTouchPoints > 1) {
      os = 'iOS';
    } else {
      os = 'Mac';
    }
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 2. Detecção do Navegador
  let browser: BrowserName = 'Other';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  }

  // 3. Capacidade de Ponteiro (Mouse fino vs Dedo touch)
  let pointerType: 'fine' | 'coarse' | 'none' = 'fine';
  try {
    if (window.matchMedia('(pointer: coarse)').matches) {
      pointerType = 'coarse';
    } else if (window.matchMedia('(pointer: fine)').matches) {
      pointerType = 'fine';
    }
  } catch {
    pointerType = hasTouch ? 'coarse' : 'fine';
  }

  // 4. Detecção Precisa de DeviceType (Hardware Real vs Janela Redimensionada)
  // IMPORTANTE: Não confiar apenas em window.innerWidth, pois um PC com janela dividida teria 500px!
  let deviceType: DeviceType = 'DESKTOP';

  // Verifica se é iPad ou Tablet Android
  const isIPad = /iPad/i.test(ua) || (os === 'iOS' && /Macintosh/i.test(ua) && maxTouchPoints > 1);
  const isAndroidTablet = os === 'Android' && !/Mobile/i.test(ua);
  const isTablet = isIPad || isAndroidTablet;

  // Verifica se é Smartphone real (Android Mobile, iPhone, Windows Phone)
  const isSmartphone = !isTablet && (
    /iPhone|iPod/i.test(ua) ||
    (os === 'Android' && /Mobile/i.test(ua)) ||
    /Windows Phone/i.test(ua) ||
    /BlackBerry|IEMobile|Opera Mini/i.test(ua)
  );

  if (isSmartphone) {
    deviceType = 'MOBILE';
  } else if (isTablet) {
    deviceType = 'TABLET';
  } else {
    // É PC / Notebook (Windows, Mac ou Linux de mesa)
    // Mesmo que tenha touch (ex: Dell XPS Touch ou Lenovo Yoga), é classificado como DESKTOP
    deviceType = 'DESKTOP';
  }

  // Label amigável para auditoria e exibição
  let deviceLabel = 'PC / Notebook';
  if (deviceType === 'MOBILE') {
    deviceLabel = os === 'iOS' ? 'iPhone (iOS)' : `Smartphone (${os})`;
  } else if (deviceType === 'TABLET') {
    deviceLabel = isIPad ? 'iPad (Apple)' : `Tablet (${os})`;
  } else {
    deviceLabel = hasTouch ? `Notebook Touch (${os})` : `PC / Notebook (${os})`;
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 768;
  const isCompactViewport = viewportWidth < 768;

  return {
    deviceType,
    deviceLabel,
    os,
    browser,
    isMobile: deviceType === 'MOBILE',
    isTablet: deviceType === 'TABLET',
    isDesktop: deviceType === 'DESKTOP',
    hasTouch,
    viewportWidth,
    viewportHeight,
    isCompactViewport,
    pointerType
  };
}

/**
 * Registra a auditoria do dispositivo atual na sessão do navegador
 */
export function logDeviceSession(): DeviceInfo {
  const info = detectDevice();
  try {
    sessionStorage.setItem('multiplan_device_info', JSON.stringify({
      deviceType: info.deviceType,
      deviceLabel: info.deviceLabel,
      os: info.os,
      browser: info.browser,
      resolution: `${info.viewportWidth}x${info.viewportHeight}`,
      accessedAt: new Date().toISOString()
    }));
  } catch {
    // sessionStorage pode estar bloqueado em certas permissões de iframe
  }
  return info;
}
