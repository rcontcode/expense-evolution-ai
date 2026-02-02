import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is touch-enabled
 * Updates on window resize to handle devices that support both
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0;
      
      // Also check screen width as additional heuristic
      const isMobileWidth = window.innerWidth < 768;
      
      setIsTouchDevice(hasTouch && isMobileWidth);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return isTouchDevice;
}
