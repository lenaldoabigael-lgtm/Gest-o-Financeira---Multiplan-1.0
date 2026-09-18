import { useState, useEffect } from 'react';
import { detectDevice, DeviceInfo, logDeviceSession } from './deviceDetect';

/**
 * Hook para consumo reativo e seguro do dispositivo em componentes React
 */
export function useDeviceDetect(): DeviceInfo {
  // Inicialização síncrona imediata para evitar Layout Shift (flicker)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    return detectDevice();
  });

  useEffect(() => {
    // Registra auditoria da sessão no primeiro carregamento
    logDeviceSession();

    const handleResize = () => {
      setDeviceInfo(prev => {
        const next = detectDevice();
        // Só atualiza o estado se houver mudança real relevante para evitar re-renders
        if (
          prev.viewportWidth !== next.viewportWidth ||
          prev.viewportHeight !== next.viewportHeight ||
          prev.deviceType !== next.deviceType
        ) {
          return next;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
