import { useMemo, memo } from 'react';

// Currency symbols - reduced set for performance
const currencySymbols = [
  '$', '€', '£', '¥', '₹', 'C$', 'CLP', '₿', 'Ξ', 'R$', 'AR$', 'S/', 'kr', '₩'
];

const colors = [
  { text: 'text-cyan-400/60', shadow: '' },
  { text: 'text-emerald-400/60', shadow: '' },
  { text: 'text-orange-400/60', shadow: '' },
  { text: 'text-amber-400/60', shadow: '' },
  { text: 'text-purple-400/60', shadow: '' },
  { text: 'text-blue-400/60', shadow: '' },
];

interface FloatingCurrency {
  id: number;
  symbol: string;
  size: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  opacity: number;
  color: typeof colors[0];
  rotation: number;
}

// Memoized currency item to prevent re-renders
const CurrencyItem = memo(({ currency }: { currency: FloatingCurrency }) => (
  <div
    className={`absolute font-bold select-none ${currency.color.text} animate-[float_6s_ease-in-out_infinite] will-change-transform`}
    style={{
      fontSize: currency.size,
      left: currency.left,
      top: currency.top,
      opacity: currency.opacity,
      animationDelay: currency.animationDelay,
      animationDuration: currency.animationDuration,
      transform: `rotate(${currency.rotation}deg)`,
    }}
  >
    {currency.symbol}
  </div>
));

CurrencyItem.displayName = 'CurrencyItem';

export const FloatingStars = memo(() => {
  // Reduced from 40 to 20 elements for better performance
  const currencies = useMemo<FloatingCurrency[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      symbol: currencySymbols[i % currencySymbols.length],
      size: Math.random() * 12 + 10,
      left: `${(i * 5) % 100}%`,
      top: `${(i * 7) % 100}%`,
      animationDelay: `${i * 0.3}s`,
      animationDuration: `${4 + (i % 3)}s`,
      opacity: 0.25 + (i % 3) * 0.1,
      color: colors[i % colors.length],
      rotation: (i % 5) * 6 - 12,
    }));
  }, []);

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,1) 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,1) 70%)',
      }}
    >
      {currencies.map((currency) => (
        <CurrencyItem key={currency.id} currency={currency} />
      ))}
      
      {/* Reduced accent symbols from 12 to 4 */}
      {[0, 1, 2, 3].map((i) => {
        const symbol = currencySymbols[i];
        const color = colors[i];
        return (
          <div
            key={`accent-${i}`}
            className="absolute animate-[float_8s_ease-in-out_infinite] will-change-transform"
            style={{
              left: `${10 + i * 25}%`,
              top: `${20 + i * 15}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          >
            <span
              className={`text-xl md:text-2xl font-black ${color.text} animate-[twinkle_4s_ease-in-out_infinite]`}
              style={{ 
                animationDelay: `${i * 0.5}s`,
                opacity: 0.4,
              }}
            >
              {symbol}
            </span>
          </div>
        );
      })}

      {/* Single shooting star instead of 3 */}
      <div 
        className="absolute top-1/3 left-0 flex items-center gap-2 opacity-0 animate-[shootingStar_12s_ease-in-out_infinite]" 
        style={{ animationDelay: '3s' }}
      >
        <span className="text-lg text-cyan-300/70 font-bold">$</span>
        <div className="w-16 h-[2px] bg-gradient-to-r from-cyan-400/50 to-transparent" />
      </div>
    </div>
  );
});

FloatingStars.displayName = 'FloatingStars';
