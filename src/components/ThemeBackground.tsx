import { useTheme } from '@/contexts/ThemeContext';

export const ThemeBackground = () => {
  const { style } = useTheme();

  const renderPattern = () => {
    switch (style) {
      case 'spring':
        return (
          <>
            {/* Floating flowers and petals */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="spring-flowers" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                  {/* Cherry blossom */}
                  <circle cx="20" cy="20" r="8" fill="hsl(350, 80%, 75%)" />
                  <circle cx="12" cy="20" r="6" fill="hsl(350, 70%, 80%)" />
                  <circle cx="28" cy="20" r="6" fill="hsl(350, 70%, 80%)" />
                  <circle cx="20" cy="12" r="6" fill="hsl(350, 70%, 80%)" />
                  <circle cx="20" cy="28" r="6" fill="hsl(350, 70%, 80%)" />
                  <circle cx="20" cy="20" r="3" fill="hsl(45, 90%, 70%)" />
                  {/* Leaf */}
                  <ellipse cx="80" cy="60" rx="12" ry="6" fill="hsl(120, 50%, 60%)" transform="rotate(-30 80 60)" />
                  <ellipse cx="100" cy="90" rx="10" ry="5" fill="hsl(140, 45%, 55%)" transform="rotate(20 100 90)" />
                  {/* Small petals floating */}
                  <circle cx="50" cy="80" r="4" fill="hsl(340, 75%, 80%)" />
                  <circle cx="90" cy="30" r="3" fill="hsl(330, 70%, 85%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#spring-flowers)" />
            </svg>
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-pink-300/20 blur-3xl" />
            <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-green-300/15 blur-3xl" />
            <div className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-yellow-200/20 blur-2xl" />
          </>
        );

      case 'summer':
        return (
          <>
            {/* Sun rays and waves */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="summer-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  {/* Sun */}
                  <circle cx="100" cy="40" r="25" fill="hsl(45, 95%, 60%)" />
                  <g stroke="hsl(45, 95%, 65%)" strokeWidth="3" fill="none">
                    <line x1="100" y1="5" x2="100" y2="15" />
                    <line x1="100" y1="65" x2="100" y2="75" />
                    <line x1="65" y1="40" x2="75" y2="40" />
                    <line x1="125" y1="40" x2="135" y2="40" />
                    <line x1="75" y1="15" x2="82" y2="22" />
                    <line x1="118" y1="58" x2="125" y2="65" />
                    <line x1="75" y1="65" x2="82" y2="58" />
                    <line x1="118" y1="22" x2="125" y2="15" />
                  </g>
                  {/* Waves */}
                  <path d="M0 150 Q25 140, 50 150 T100 150 T150 150 T200 150" stroke="hsl(195, 80%, 55%)" strokeWidth="4" fill="none" opacity="0.6" />
                  <path d="M0 170 Q25 160, 50 170 T100 170 T150 170 T200 170" stroke="hsl(200, 75%, 50%)" strokeWidth="3" fill="none" opacity="0.4" />
                  {/* Palm leaf hint */}
                  <path d="M160 100 Q180 80, 195 95" stroke="hsl(120, 40%, 45%)" strokeWidth="3" fill="none" />
                  <path d="M160 100 Q175 85, 185 105" stroke="hsl(130, 35%, 50%)" strokeWidth="2" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#summer-pattern)" />
            </svg>
            {/* Warm glows */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-yellow-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-orange-300/15 blur-2xl" />
          </>
        );

      case 'autumn':
        return (
          <>
            {/* Falling leaves */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="autumn-leaves" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                  {/* Maple leaf 1 */}
                  <path d="M30 30 L35 20 L40 30 L50 25 L45 35 L55 40 L45 45 L50 55 L40 50 L35 60 L30 50 L20 55 L25 45 L15 40 L25 35 L20 25 Z" 
                        fill="hsl(25, 85%, 50%)" transform="rotate(15 35 40)" />
                  {/* Maple leaf 2 */}
                  <path d="M100 80 L105 70 L110 80 L120 75 L115 85 L125 90 L115 95 L120 105 L110 100 L105 110 L100 100 L90 105 L95 95 L85 90 L95 85 L90 75 Z" 
                        fill="hsl(35, 90%, 55%)" transform="rotate(-20 105 90)" />
                  {/* Oak leaf */}
                  <ellipse cx="80" cy="30" rx="15" ry="8" fill="hsl(15, 75%, 45%)" transform="rotate(30 80 30)" />
                  {/* Small leaves */}
                  <circle cx="130" cy="120" r="6" fill="hsl(40, 80%, 50%)" />
                  <circle cx="20" cy="100" r="5" fill="hsl(20, 85%, 48%)" />
                  <circle cx="60" cy="130" r="4" fill="hsl(30, 75%, 52%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#autumn-leaves)" />
            </svg>
            {/* Warm autumn glows */}
            <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute bottom-10 right-20 w-64 h-64 rounded-full bg-amber-600/15 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-red-400/15 blur-2xl" />
          </>
        );

      case 'winter':
        return (
          <>
            {/* Snowflakes */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="winter-snow" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  {/* Snowflake 1 */}
                  <g stroke="hsl(210, 50%, 85%)" strokeWidth="1.5" fill="none" transform="translate(25, 25)">
                    <line x1="0" y1="-12" x2="0" y2="12" />
                    <line x1="-10" y1="-6" x2="10" y2="6" />
                    <line x1="-10" y1="6" x2="10" y2="-6" />
                    <line x1="-3" y1="-8" x2="0" y2="-5" />
                    <line x1="3" y1="-8" x2="0" y2="-5" />
                    <line x1="-3" y1="8" x2="0" y2="5" />
                    <line x1="3" y1="8" x2="0" y2="5" />
                  </g>
                  {/* Snowflake 2 */}
                  <g stroke="hsl(200, 40%, 80%)" strokeWidth="1" fill="none" transform="translate(70, 60)">
                    <line x1="0" y1="-8" x2="0" y2="8" />
                    <line x1="-7" y1="-4" x2="7" y2="4" />
                    <line x1="-7" y1="4" x2="7" y2="-4" />
                  </g>
                  {/* Small dots (snow) */}
                  <circle cx="50" cy="20" r="2" fill="hsl(210, 30%, 90%)" />
                  <circle cx="80" cy="85" r="1.5" fill="hsl(200, 35%, 88%)" />
                  <circle cx="15" cy="70" r="2.5" fill="hsl(210, 40%, 92%)" />
                  <circle cx="90" cy="30" r="1" fill="hsl(205, 35%, 85%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#winter-snow)" />
            </svg>
            {/* Icy glows */}
            <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-cyan-100/25 blur-3xl" />
            <div className="absolute top-1/3 right-1/3 w-36 h-36 rounded-full bg-slate-200/20 blur-2xl" />
          </>
        );

      case 'crypto':
        return (
          <>
            {/* Crypto patterns - blockchain nodes */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="crypto-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="80" y2="40" stroke="hsl(45, 90%, 55%)" strokeWidth="0.5" opacity="0.3" />
                  <line x1="40" y1="0" x2="40" y2="80" stroke="hsl(45, 90%, 55%)" strokeWidth="0.5" opacity="0.3" />
                  {/* Bitcoin symbol hint */}
                  <circle cx="40" cy="40" r="15" stroke="hsl(38, 95%, 55%)" strokeWidth="2" fill="none" />
                  <text x="35" y="46" fill="hsl(38, 95%, 55%)" fontSize="16" fontWeight="bold">₿</text>
                  {/* Connection nodes */}
                  <circle cx="10" cy="10" r="3" fill="hsl(45, 85%, 60%)" />
                  <circle cx="70" cy="70" r="3" fill="hsl(45, 85%, 60%)" />
                  <circle cx="70" cy="10" r="2" fill="hsl(50, 80%, 55%)" />
                  <circle cx="10" cy="70" r="2" fill="hsl(50, 80%, 55%)" />
                  {/* Connecting lines */}
                  <line x1="10" y1="10" x2="25" y2="25" stroke="hsl(45, 80%, 50%)" strokeWidth="1" opacity="0.5" />
                  <line x1="70" y1="70" x2="55" y2="55" stroke="hsl(45, 80%, 50%)" strokeWidth="1" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#crypto-grid)" />
            </svg>
            {/* Glow effects */}
            <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-yellow-500/25 blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-amber-400/15 blur-2xl" />
          </>
        );

      case 'gaming':
        return (
          <>
            {/* Gaming pattern - controller hints, pixels */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gaming-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                  {/* Pixel blocks */}
                  <rect x="10" y="10" width="8" height="8" fill="hsl(280, 85%, 60%)" />
                  <rect x="20" y="10" width="8" height="8" fill="hsl(320, 80%, 55%)" />
                  <rect x="10" y="20" width="8" height="8" fill="hsl(260, 75%, 65%)" />
                  {/* Controller button hints */}
                  <circle cx="80" cy="40" r="8" stroke="hsl(280, 70%, 60%)" strokeWidth="2" fill="none" />
                  <circle cx="95" cy="55" r="8" stroke="hsl(320, 75%, 55%)" strokeWidth="2" fill="none" />
                  <circle cx="65" cy="55" r="8" stroke="hsl(180, 80%, 50%)" strokeWidth="2" fill="none" />
                  <circle cx="80" cy="70" r="8" stroke="hsl(140, 70%, 50%)" strokeWidth="2" fill="none" />
                  {/* D-pad */}
                  <rect x="30" y="75" width="20" height="8" fill="hsl(270, 60%, 55%)" rx="2" />
                  <rect x="36" y="69" width="8" height="20" fill="hsl(270, 60%, 55%)" rx="2" />
                  {/* Stars/sparkles */}
                  <polygon points="100,100 102,106 108,106 103,110 105,116 100,112 95,116 97,110 92,106 98,106" fill="hsl(45, 90%, 60%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gaming-pattern)" />
            </svg>
            {/* Neon glows */}
            <div className="absolute top-5 left-10 w-48 h-48 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="absolute bottom-10 right-5 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-cyan-400/20 blur-2xl" />
          </>
        );

      case 'sports':
        return (
          <>
            {/* Sports patterns - balls, fields */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="sports-pattern" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                  {/* Soccer ball */}
                  <circle cx="40" cy="40" r="18" stroke="hsl(145, 70%, 40%)" strokeWidth="2" fill="none" />
                  <polygon points="40,25 50,32 47,44 33,44 30,32" stroke="hsl(145, 70%, 40%)" strokeWidth="1.5" fill="none" />
                  {/* Basketball lines */}
                  <circle cx="110" cy="100" r="16" stroke="hsl(25, 90%, 50%)" strokeWidth="2" fill="none" />
                  <path d="M94 100 Q110 90, 126 100" stroke="hsl(25, 90%, 50%)" strokeWidth="1.5" fill="none" />
                  <line x1="110" y1="84" x2="110" y2="116" stroke="hsl(25, 90%, 50%)" strokeWidth="1.5" />
                  {/* Tennis ball */}
                  <circle cx="100" cy="35" r="12" stroke="hsl(65, 80%, 50%)" strokeWidth="2" fill="none" />
                  <path d="M92 25 Q100 35, 92 45" stroke="hsl(65, 80%, 50%)" strokeWidth="1.5" fill="none" />
                  <path d="M108 25 Q100 35, 108 45" stroke="hsl(65, 80%, 50%)" strokeWidth="1.5" fill="none" />
                  {/* Field lines */}
                  <line x1="0" y1="130" x2="150" y2="130" stroke="hsl(145, 60%, 45%)" strokeWidth="3" strokeDasharray="10,5" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sports-pattern)" />
            </svg>
            {/* Field glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-500/10 to-transparent" />
            <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute top-1/3 left-10 w-40 h-40 rounded-full bg-orange-400/15 blur-2xl" />
          </>
        );

      case 'music':
        return (
          <>
            {/* Music patterns - notes, waves */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="music-pattern" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
                  {/* Music note 1 */}
                  <ellipse cx="30" cy="50" rx="8" ry="6" fill="hsl(280, 75%, 55%)" transform="rotate(-20 30 50)" />
                  <line x1="37" y1="48" x2="37" y2="20" stroke="hsl(280, 75%, 55%)" strokeWidth="2" />
                  <path d="M37 20 Q50 25, 45 35" stroke="hsl(280, 75%, 55%)" strokeWidth="2" fill="none" />
                  {/* Music note 2 */}
                  <ellipse cx="100" cy="90" rx="7" ry="5" fill="hsl(320, 70%, 50%)" transform="rotate(-20 100 90)" />
                  <line x1="106" y1="88" x2="106" y2="65" stroke="hsl(320, 70%, 50%)" strokeWidth="2" />
                  {/* Sound waves */}
                  <path d="M60 70 Q70 60, 80 70 T100 70" stroke="hsl(260, 65%, 60%)" strokeWidth="2" fill="none" opacity="0.6" />
                  <path d="M55 80 Q70 65, 85 80 T115 80" stroke="hsl(290, 60%, 55%)" strokeWidth="1.5" fill="none" opacity="0.4" />
                  {/* Equalizer bars */}
                  <rect x="120" y="30" width="4" height="15" fill="hsl(300, 70%, 55%)" rx="1" />
                  <rect x="126" y="25" width="4" height="20" fill="hsl(280, 65%, 60%)" rx="1" />
                  <rect x="132" y="35" width="4" height="10" fill="hsl(320, 75%, 50%)" rx="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#music-pattern)" />
            </svg>
            {/* Neon music glows */}
            <div className="absolute top-10 left-1/4 w-56 h-56 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-violet-400/20 blur-2xl" />
          </>
        );

      case 'coffee':
        return (
          <>
            {/* Coffee patterns - cups, beans, steam */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="coffee-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                  {/* Coffee cup */}
                  <path d="M30 50 L25 80 Q25 90 40 90 Q55 90 55 80 L50 50 Z" stroke="hsl(25, 60%, 45%)" strokeWidth="2" fill="none" />
                  <ellipse cx="40" cy="50" rx="13" ry="5" stroke="hsl(25, 60%, 45%)" strokeWidth="2" fill="none" />
                  <path d="M55 55 Q70 55, 70 70 Q70 80, 55 80" stroke="hsl(25, 55%, 50%)" strokeWidth="2" fill="none" />
                  {/* Steam */}
                  <path d="M35 42 Q32 35, 35 28 Q38 21, 35 14" stroke="hsl(30, 50%, 55%)" strokeWidth="1.5" fill="none" opacity="0.6" />
                  <path d="M45 42 Q48 35, 45 28 Q42 21, 45 14" stroke="hsl(30, 50%, 55%)" strokeWidth="1.5" fill="none" opacity="0.6" />
                  {/* Coffee beans */}
                  <ellipse cx="90" cy="40" rx="10" ry="6" fill="hsl(25, 70%, 35%)" transform="rotate(30 90 40)" />
                  <line x1="85" y1="38" x2="95" y2="42" stroke="hsl(25, 50%, 25%)" strokeWidth="1" />
                  <ellipse cx="100" cy="85" rx="8" ry="5" fill="hsl(20, 65%, 38%)" transform="rotate(-15 100 85)" />
                  <line x1="96" y1="83" x2="104" y2="87" stroke="hsl(20, 45%, 28%)" strokeWidth="1" />
                  {/* Small dots */}
                  <circle cx="75" cy="110" r="3" fill="hsl(30, 60%, 40%)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#coffee-pattern)" />
            </svg>
            {/* Warm coffee glows */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-600/20 blur-3xl" />
            <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-orange-700/15 blur-3xl" />
            <div className="absolute top-1/3 left-1/4 w-36 h-36 rounded-full bg-yellow-600/15 blur-2xl" />
          </>
        );

      case 'nature':
        return (
          <>
            {/* Nature patterns - leaves, trees, mountains */}
            <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="nature-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                  {/* Mountain */}
                  <polygon points="80,40 120,100 40,100" fill="none" stroke="hsl(200, 30%, 50%)" strokeWidth="2" />
                  <polygon points="80,50 100,100 60,100" fill="hsl(200, 25%, 55%)" opacity="0.3" />
                  {/* Tree */}
                  <polygon points="30,90 45,60 40,65 50,40 45,45 50,25 55,45 50,40 60,65 55,60 70,90" 
                           fill="hsl(140, 50%, 40%)" />
                  <rect x="47" y="90" width="6" height="15" fill="hsl(30, 50%, 35%)" />
                  {/* Leaves */}
                  <ellipse cx="130" cy="50" rx="15" ry="8" fill="hsl(120, 45%, 45%)" transform="rotate(-30 130 50)" />
                  <line x1="120" y1="55" x2="140" y2="45" stroke="hsl(120, 40%, 35%)" strokeWidth="1" />
                  {/* Flower */}
                  <circle cx="100" cy="130" r="6" fill="hsl(340, 60%, 60%)" />
                  <circle cx="94" cy="127" r="5" fill="hsl(350, 55%, 65%)" />
                  <circle cx="106" cy="127" r="5" fill="hsl(350, 55%, 65%)" />
                  <circle cx="100" cy="121" r="5" fill="hsl(350, 55%, 65%)" />
                  <circle cx="100" cy="130" r="2" fill="hsl(45, 80%, 55%)" />
                  {/* Birds */}
                  <path d="M140 30 Q145 25, 150 30" stroke="hsl(220, 30%, 40%)" strokeWidth="1.5" fill="none" />
                  <path d="M145 35 Q150 30, 155 35" stroke="hsl(220, 30%, 40%)" strokeWidth="1.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#nature-pattern)" />
            </svg>
            {/* Nature glows */}
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-emerald-300/15 blur-2xl" />
          </>
        );

      default:
        return null;
    }
  };

  // Only render for themed styles
  const themedStyles = ['spring', 'summer', 'autumn', 'winter', 'crypto', 'gaming', 'sports', 'music', 'coffee', 'nature'];
  if (!themedStyles.includes(style)) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {renderPattern()}
    </div>
  );
};
