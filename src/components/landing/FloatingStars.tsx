import { useMemo } from 'react';

// Currency symbols - Global coverage with Americas & Hispanic world focus
const currencySymbols = [
  // Major World Currencies
  '$',    // USD - US Dollar
  '€',    // EUR - Euro
  '£',    // GBP - British Pound
  '¥',    // JPY/CNY - Japanese Yen / Chinese Yuan
  '₹',    // INR - Indian Rupee
  'CHF',  // Swiss Franc
  'A$',   // AUD - Australian Dollar
  '₿',    // BTC - Bitcoin
  'Ξ',    // ETH - Ethereum
  
  // North America
  'C$',   // CAD - Canadian Dollar
  'US$',  // USD explicit
  'MX$',  // MXN - Mexican Peso
  
  // South America
  'CLP',  // Chilean Peso
  'AR$',  // ARS - Argentine Peso
  'R$',   // BRL - Brazilian Real
  'COP',  // Colombian Peso
  'S/',   // PEN - Peruvian Sol
  '$U',   // UYU - Uruguayan Peso
  '₲',    // PYG - Paraguayan Guarani
  'Bs',   // BOB/VES - Bolivian/Venezuelan Bolivar
  
  // Central America & Caribbean
  'Q',    // GTQ - Guatemalan Quetzal
  '₡',    // CRC - Costa Rican Colón
  'L',    // HNL - Honduran Lempira
  'B/.',  // PAB - Panamanian Balboa
  'RD$',  // DOP - Dominican Peso
  'J$',   // JMD - Jamaican Dollar
  
  // Other Important
  '₽',    // RUB - Russian Ruble
  '₩',    // KRW - South Korean Won
  '₪',    // ILS - Israeli Shekel
  '₴',    // UAH - Ukrainian Hryvnia
  'kr',   // Scandinavian Krona/Krone
  'zł',   // PLN - Polish Zloty
  'R',    // ZAR - South African Rand
];

const colors = [
  { text: 'text-cyan-400', shadow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' },
  { text: 'text-emerald-400', shadow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' },
  { text: 'text-orange-400', shadow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' },
  { text: 'text-amber-400', shadow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' },
  { text: 'text-purple-400', shadow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' },
  { text: 'text-pink-400', shadow: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' },
  { text: 'text-blue-400', shadow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' },
  { text: 'text-teal-400', shadow: 'drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]' },
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

export const FloatingStars = () => {
  const currencies = useMemo<FloatingCurrency[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      symbol: currencySymbols[Math.floor(Math.random() * currencySymbols.length)],
      size: Math.random() * 14 + 10, // 10-24px
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 4 + 3}s`, // 3-7s
      opacity: Math.random() * 0.4 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 30 - 15, // -15 to 15 degrees
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating currency symbols */}
      {currencies.map((currency) => (
        <div
          key={currency.id}
          className={`absolute font-bold select-none ${currency.color.text} ${currency.color.shadow} animate-[float_6s_ease-in-out_infinite]`}
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
      ))}
      
      {/* Larger accent currency symbols */}
      {Array.from({ length: 12 }).map((_, i) => {
        const symbol = currencySymbols[i % currencySymbols.length];
        const color = colors[i % colors.length];
        return (
          <div
            key={`accent-${i}`}
            className="absolute animate-[float_8s_ease-in-out_infinite]"
            style={{
              left: `${5 + (i * 8) % 90}%`,
              top: `${10 + Math.random() * 70}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <span
              className={`text-2xl md:text-3xl font-black ${color.text} ${color.shadow} animate-[twinkle_3s_ease-in-out_infinite]`}
              style={{ 
                animationDelay: `${i * 0.25}s`,
                opacity: 0.5,
              }}
            >
              {symbol}
            </span>
          </div>
        );
      })}

      {/* Shooting currency streaks */}
      <div 
        className="absolute top-1/4 left-0 flex items-center gap-2 opacity-0 animate-[shootingStar_10s_ease-in-out_infinite]" 
        style={{ animationDelay: '2s' }}
      >
        <span className="text-lg text-cyan-300 font-bold">$</span>
        <div className="w-20 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
      </div>
      <div 
        className="absolute top-1/2 left-0 flex items-center gap-2 opacity-0 animate-[shootingStar_10s_ease-in-out_infinite]" 
        style={{ animationDelay: '5s' }}
      >
        <span className="text-lg text-amber-300 font-bold">€</span>
        <div className="w-16 h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
      </div>
      <div 
        className="absolute top-3/4 left-0 flex items-center gap-2 opacity-0 animate-[shootingStar_10s_ease-in-out_infinite]" 
        style={{ animationDelay: '8s' }}
      >
        <span className="text-lg text-emerald-300 font-bold">₿</span>
        <div className="w-24 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />
      </div>
    </div>
  );
};
