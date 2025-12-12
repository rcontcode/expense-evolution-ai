import { useTheme } from '@/contexts/ThemeContext';

export const ThemeBackground = () => {
  const { style } = useTheme();

  const renderPattern = () => {
    switch (style) {
      case 'spring':
        return (
          <>
            {/* Top left corner flowers */}
            <svg className="absolute top-0 left-0 w-48 h-48 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="10" fill="hsl(350, 80%, 75%)" />
              <circle cx="15" cy="25" r="7" fill="hsl(350, 70%, 80%)" />
              <circle cx="35" cy="25" r="7" fill="hsl(350, 70%, 80%)" />
              <circle cx="25" cy="15" r="7" fill="hsl(350, 70%, 80%)" />
              <circle cx="25" cy="35" r="7" fill="hsl(350, 70%, 80%)" />
              <circle cx="25" cy="25" r="4" fill="hsl(45, 90%, 70%)" />
              <ellipse cx="60" cy="50" rx="12" ry="6" fill="hsl(120, 50%, 60%)" transform="rotate(-30 60 50)" />
              <circle cx="80" cy="20" r="6" fill="hsl(340, 75%, 80%)" />
              <circle cx="45" cy="70" r="5" fill="hsl(330, 70%, 85%)" />
            </svg>
            {/* Top right corner */}
            <svg className="absolute top-0 right-0 w-40 h-40 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="120" cy="30" r="8" fill="hsl(340, 75%, 78%)" />
              <circle cx="100" cy="50" r="6" fill="hsl(350, 70%, 82%)" />
              <ellipse cx="130" cy="60" rx="10" ry="5" fill="hsl(140, 45%, 55%)" transform="rotate(20 130 60)" />
            </svg>
            {/* Bottom left corner */}
            <svg className="absolute bottom-0 left-0 w-56 h-56 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="30" cy="200" rx="18" ry="9" fill="hsl(130, 50%, 55%)" transform="rotate(-15 30 200)" />
              <ellipse cx="70" cy="220" rx="14" ry="7" fill="hsl(120, 45%, 60%)" transform="rotate(10 70 220)" />
              <circle cx="50" cy="180" r="7" fill="hsl(340, 70%, 80%)" />
              <circle cx="20" cy="160" r="5" fill="hsl(350, 65%, 82%)" />
            </svg>
            {/* Bottom right corner */}
            <svg className="absolute bottom-0 right-0 w-44 h-44 opacity-20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="140" cy="140" r="12" fill="hsl(350, 75%, 75%)" />
              <circle cx="130" cy="140" r="8" fill="hsl(350, 70%, 80%)" />
              <circle cx="150" cy="140" r="8" fill="hsl(350, 70%, 80%)" />
              <circle cx="140" cy="130" r="8" fill="hsl(350, 70%, 80%)" />
              <circle cx="140" cy="140" r="4" fill="hsl(45, 90%, 70%)" />
              <circle cx="120" cy="120" r="5" fill="hsl(330, 65%, 82%)" />
            </svg>
            {/* Subtle corner glows */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-pink-300/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-green-300/10 blur-3xl" />
          </>
        );

      case 'summer':
        return (
          <>
            {/* Top right sun */}
            <svg className="absolute top-4 right-4 w-32 h-32 opacity-35" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="22" fill="hsl(45, 95%, 60%)" />
              <g stroke="hsl(45, 95%, 65%)" strokeWidth="3" fill="none">
                <line x1="50" y1="18" x2="50" y2="28" />
                <line x1="50" y1="72" x2="50" y2="82" />
                <line x1="18" y1="50" x2="28" y2="50" />
                <line x1="72" y1="50" x2="82" y2="50" />
                <line x1="27" y1="27" x2="34" y2="34" />
                <line x1="66" y1="66" x2="73" y2="73" />
                <line x1="27" y1="73" x2="34" y2="66" />
                <line x1="66" y1="34" x2="73" y2="27" />
              </g>
            </svg>
            {/* Bottom waves */}
            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-25" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 15 Q50 5, 100 15 T200 15 T300 15 T400 15 T500 15 T600 15 T700 15 T800 15" 
                    stroke="hsl(195, 80%, 55%)" strokeWidth="3" fill="none" />
              <path d="M0 30 Q50 20, 100 30 T200 30 T300 30 T400 30 T500 30 T600 30 T700 30 T800 30" 
                    stroke="hsl(200, 75%, 50%)" strokeWidth="2" fill="none" opacity="0.6" />
            </svg>
            {/* Palm hint top left */}
            <svg className="absolute top-10 left-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 60 Q35 30, 55 45" stroke="hsl(120, 40%, 45%)" strokeWidth="3" fill="none" />
              <path d="M10 60 Q30 35, 45 55" stroke="hsl(130, 35%, 50%)" strokeWidth="2" fill="none" />
              <path d="M10 60 Q25 45, 40 65" stroke="hsl(125, 38%, 48%)" strokeWidth="2" fill="none" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-yellow-400/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-20 bg-cyan-400/10 blur-2xl" />
          </>
        );

      case 'autumn':
        return (
          <>
            {/* Top left falling leaves */}
            <svg className="absolute top-0 left-0 w-48 h-48 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L35 20 L40 30 L50 25 L45 35 L55 40 L45 45 L50 55 L40 50 L35 60 L30 50 L20 55 L25 45 L15 40 L25 35 L20 25 Z" 
                    fill="hsl(25, 85%, 50%)" transform="rotate(15 35 40)" />
              <circle cx="70" cy="25" r="6" fill="hsl(35, 90%, 55%)" />
              <circle cx="20" cy="70" r="5" fill="hsl(20, 85%, 48%)" />
            </svg>
            {/* Top right leaves */}
            <svg className="absolute top-0 right-0 w-40 h-40 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 30 L105 20 L110 30 L120 25 L115 35 L125 40 L115 45 L120 55 L110 50 L105 60 L100 50 L90 55 L95 45 L85 40 L95 35 L90 25 Z" 
                    fill="hsl(35, 90%, 55%)" transform="rotate(-20 105 40)" />
              <ellipse cx="130" cy="60" rx="12" ry="6" fill="hsl(15, 75%, 45%)" transform="rotate(25 130 60)" />
            </svg>
            {/* Bottom corners */}
            <svg className="absolute bottom-0 left-0 w-44 h-44 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="30" cy="140" rx="15" ry="8" fill="hsl(25, 80%, 48%)" transform="rotate(-20 30 140)" />
              <circle cx="60" cy="160" r="6" fill="hsl(40, 80%, 50%)" />
              <circle cx="25" cy="170" r="4" fill="hsl(30, 75%, 52%)" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-40 h-40 opacity-20" xmlns="http://www.w3.org/2000/svg">
              <path d="M130 140 L135 130 L140 140 L150 135 L145 145 L155 150 L145 155 L150 165 L140 160 L135 170 L130 160 L120 165 L125 155 L115 150 L125 145 L120 135 Z" 
                    fill="hsl(25, 85%, 52%)" transform="rotate(10 135 150)" />
            </svg>
            {/* Warm corner glows */}
            <div className="absolute top-0 left-0 w-36 h-36 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-amber-600/10 blur-3xl" />
          </>
        );

      case 'winter':
        return (
          <>
            {/* Top corners snowflakes */}
            <svg className="absolute top-4 left-4 w-24 h-24 opacity-40" xmlns="http://www.w3.org/2000/svg">
              <g stroke="hsl(210, 50%, 85%)" strokeWidth="1.5" fill="none">
                <line x1="30" y1="15" x2="30" y2="45" />
                <line x1="17" y1="22" x2="43" y2="38" />
                <line x1="17" y1="38" x2="43" y2="22" />
                <line x1="25" y1="18" x2="30" y2="23" />
                <line x1="35" y1="18" x2="30" y2="23" />
                <line x1="25" y1="42" x2="30" y2="37" />
                <line x1="35" y1="42" x2="30" y2="37" />
              </g>
            </svg>
            <svg className="absolute top-8 right-8 w-20 h-20 opacity-35" xmlns="http://www.w3.org/2000/svg">
              <g stroke="hsl(200, 40%, 80%)" strokeWidth="1" fill="none">
                <line x1="30" y1="20" x2="30" y2="40" />
                <line x1="20" y1="25" x2="40" y2="35" />
                <line x1="20" y1="35" x2="40" y2="25" />
              </g>
              <circle cx="50" cy="15" r="3" fill="hsl(210, 30%, 90%)" />
            </svg>
            {/* Bottom corners */}
            <svg className="absolute bottom-4 left-4 w-28 h-28 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="100" r="3" fill="hsl(210, 35%, 88%)" />
              <circle cx="35" cy="110" r="2" fill="hsl(205, 35%, 85%)" />
              <circle cx="50" cy="95" r="2.5" fill="hsl(210, 40%, 92%)" />
              <g stroke="hsl(210, 45%, 82%)" strokeWidth="1" fill="none">
                <line x1="70" y1="80" x2="70" y2="100" />
                <line x1="60" y1="85" x2="80" y2="95" />
                <line x1="60" y1="95" x2="80" y2="85" />
              </g>
            </svg>
            <svg className="absolute bottom-4 right-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <g stroke="hsl(200, 45%, 80%)" strokeWidth="1.5" fill="none">
                <line x1="60" y1="50" x2="60" y2="80" />
                <line x1="47" y1="57" x2="73" y2="73" />
                <line x1="47" y1="73" x2="73" y2="57" />
              </g>
              <circle cx="85" cy="90" r="2" fill="hsl(210, 35%, 88%)" />
            </svg>
            {/* Icy corner glows */}
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-blue-200/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full bg-cyan-100/15 blur-3xl" />
          </>
        );

      case 'crypto':
        return (
          <>
            {/* Top left blockchain nodes */}
            <svg className="absolute top-4 left-4 w-32 h-32 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="4" fill="hsl(45, 85%, 60%)" />
              <circle cx="50" cy="15" r="3" fill="hsl(50, 80%, 55%)" />
              <circle cx="25" cy="50" r="3" fill="hsl(45, 80%, 58%)" />
              <line x1="20" y1="20" x2="50" y2="15" stroke="hsl(45, 80%, 50%)" strokeWidth="1" opacity="0.5" />
              <line x1="20" y1="20" x2="25" y2="50" stroke="hsl(45, 80%, 50%)" strokeWidth="1" opacity="0.5" />
            </svg>
            {/* Top right Bitcoin symbol */}
            <svg className="absolute top-4 right-4 w-28 h-28 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="20" stroke="hsl(38, 95%, 55%)" strokeWidth="2" fill="none" />
              <text x="42" y="58" fill="hsl(38, 95%, 55%)" fontSize="22" fontWeight="bold">₿</text>
            </svg>
            {/* Bottom corners */}
            <svg className="absolute bottom-4 left-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="70" r="3" fill="hsl(45, 85%, 60%)" />
              <circle cx="40" cy="80" r="4" fill="hsl(50, 80%, 55%)" />
              <line x1="15" y1="70" x2="40" y2="80" stroke="hsl(45, 75%, 52%)" strokeWidth="1" opacity="0.4" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-orange-500/15 blur-3xl" />
          </>
        );

      case 'gaming':
        return (
          <>
            {/* Top left pixel blocks */}
            <svg className="absolute top-4 left-4 w-28 h-28 opacity-35" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="10" height="10" fill="hsl(280, 85%, 60%)" />
              <rect x="22" y="10" width="10" height="10" fill="hsl(320, 80%, 55%)" />
              <rect x="10" y="22" width="10" height="10" fill="hsl(260, 75%, 65%)" />
              <rect x="22" y="22" width="10" height="10" fill="hsl(195, 85%, 55%)" />
              <rect x="34" y="16" width="8" height="8" fill="hsl(145, 70%, 55%)" />
            </svg>
            {/* Top right controller buttons */}
            <svg className="absolute top-4 right-4 w-28 h-28 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="30" r="10" stroke="hsl(280, 70%, 60%)" strokeWidth="2" fill="none" />
              <circle cx="80" cy="50" r="10" stroke="hsl(320, 75%, 55%)" strokeWidth="2" fill="none" />
              <circle cx="40" cy="50" r="10" stroke="hsl(180, 80%, 50%)" strokeWidth="2" fill="none" />
              <circle cx="60" cy="70" r="10" stroke="hsl(140, 70%, 50%)" strokeWidth="2" fill="none" />
            </svg>
            {/* Bottom left D-pad */}
            <svg className="absolute bottom-4 left-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="40" width="30" height="10" fill="hsl(270, 60%, 55%)" rx="2" />
              <rect x="35" y="30" width="10" height="30" fill="hsl(270, 60%, 55%)" rx="2" />
            </svg>
            {/* Bottom right star */}
            <svg className="absolute bottom-4 right-4 w-20 h-20 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <polygon points="40,10 43,20 53,20 45,27 48,37 40,31 32,37 35,27 27,20 37,20" fill="hsl(45, 90%, 60%)" />
            </svg>
            {/* Neon corner glows */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-pink-500/15 blur-3xl" />
          </>
        );

      case 'sports':
        return (
          <>
            {/* Top left soccer ball */}
            <svg className="absolute top-4 left-4 w-24 h-24 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="35" cy="35" r="22" stroke="hsl(145, 70%, 40%)" strokeWidth="2" fill="none" />
              <polygon points="35,18 43,26 40,36 30,36 27,26" stroke="hsl(145, 70%, 40%)" strokeWidth="1.5" fill="none" />
            </svg>
            {/* Top right basketball */}
            <svg className="absolute top-4 right-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="45" r="20" stroke="hsl(25, 90%, 50%)" strokeWidth="2" fill="none" />
              <path d="M25 45 Q45 35, 65 45" stroke="hsl(25, 90%, 50%)" strokeWidth="1.5" fill="none" />
              <line x1="45" y1="25" x2="45" y2="65" stroke="hsl(25, 90%, 50%)" strokeWidth="1.5" />
            </svg>
            {/* Bottom field lines */}
            <svg className="absolute bottom-0 left-0 w-full h-12 opacity-20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="0" y1="8" x2="100%" y2="8" stroke="hsl(145, 60%, 45%)" strokeWidth="3" strokeDasharray="15,8" />
            </svg>
            {/* Bottom right tennis ball */}
            <svg className="absolute bottom-4 right-4 w-20 h-20 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="15" stroke="hsl(65, 80%, 50%)" strokeWidth="2" fill="none" />
              <path d="M30 28 Q40 40, 30 52" stroke="hsl(65, 80%, 50%)" strokeWidth="1.5" fill="none" />
              <path d="M50 28 Q40 40, 50 52" stroke="hsl(65, 80%, 50%)" strokeWidth="1.5" fill="none" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-28 h-28 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-orange-400/10 blur-2xl" />
          </>
        );

      case 'music':
        return (
          <>
            {/* Top left music note */}
            <svg className="absolute top-4 left-4 w-28 h-28 opacity-35" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="25" cy="55" rx="12" ry="8" fill="hsl(280, 75%, 55%)" transform="rotate(-20 25 55)" />
              <line x1="35" y1="52" x2="35" y2="18" stroke="hsl(280, 75%, 55%)" strokeWidth="3" />
              <path d="M35 18 Q55 25, 48 40" stroke="hsl(280, 75%, 55%)" strokeWidth="3" fill="none" />
            </svg>
            {/* Top right equalizer */}
            <svg className="absolute top-4 right-4 w-24 h-24 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="35" width="6" height="20" fill="hsl(300, 70%, 55%)" rx="2" />
              <rect x="40" y="25" width="6" height="30" fill="hsl(280, 65%, 60%)" rx="2" />
              <rect x="50" y="40" width="6" height="15" fill="hsl(320, 75%, 50%)" rx="2" />
              <rect x="60" y="30" width="6" height="25" fill="hsl(290, 70%, 55%)" rx="2" />
            </svg>
            {/* Bottom left note */}
            <svg className="absolute bottom-4 left-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="30" cy="70" rx="10" ry="6" fill="hsl(320, 70%, 50%)" transform="rotate(-20 30 70)" />
              <line x1="38" y1="68" x2="38" y2="40" stroke="hsl(320, 70%, 50%)" strokeWidth="2" />
            </svg>
            {/* Bottom right waves */}
            <svg className="absolute bottom-4 right-4 w-28 h-20 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 40 Q25 30, 40 40 T70 40 T100 40" stroke="hsl(260, 65%, 60%)" strokeWidth="2" fill="none" />
              <path d="M5 55 Q25 42, 45 55 T85 55" stroke="hsl(290, 60%, 55%)" strokeWidth="1.5" fill="none" opacity="0.7" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-pink-500/15 blur-3xl" />
          </>
        );

      case 'coffee':
        return (
          <>
            {/* Top left coffee cup */}
            <svg className="absolute top-4 left-4 w-28 h-32 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 45 L15 80 Q15 92 30 92 Q45 92 45 80 L40 45 Z" stroke="hsl(25, 60%, 45%)" strokeWidth="2" fill="none" />
              <ellipse cx="30" cy="45" rx="12" ry="5" stroke="hsl(25, 60%, 45%)" strokeWidth="2" fill="none" />
              <path d="M45 50 Q58 50, 58 65 Q58 75, 45 75" stroke="hsl(25, 55%, 50%)" strokeWidth="2" fill="none" />
              {/* Steam */}
              <path d="M25 38 Q22 30, 25 22" stroke="hsl(30, 50%, 55%)" strokeWidth="1.5" fill="none" opacity="0.6" />
              <path d="M35 38 Q38 30, 35 22" stroke="hsl(30, 50%, 55%)" strokeWidth="1.5" fill="none" opacity="0.6" />
            </svg>
            {/* Top right beans */}
            <svg className="absolute top-4 right-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="35" rx="14" ry="8" fill="hsl(25, 70%, 35%)" transform="rotate(30 50 35)" />
              <line x1="42" y1="32" x2="58" y2="38" stroke="hsl(25, 50%, 25%)" strokeWidth="1.5" />
              <ellipse cx="70" cy="55" rx="12" ry="7" fill="hsl(20, 65%, 38%)" transform="rotate(-15 70 55)" />
              <line x1="63" y1="52" x2="77" y2="58" stroke="hsl(20, 45%, 28%)" strokeWidth="1.5" />
            </svg>
            {/* Bottom left bean */}
            <svg className="absolute bottom-4 left-4 w-20 h-20 opacity-20" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="40" cy="50" rx="16" ry="10" fill="hsl(25, 68%, 36%)" transform="rotate(-25 40 50)" />
              <line x1="30" y1="46" x2="50" y2="54" stroke="hsl(25, 48%, 26%)" strokeWidth="1.5" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-amber-600/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-orange-700/10 blur-3xl" />
          </>
        );

      case 'nature':
        return (
          <>
            {/* Top left tree */}
            <svg className="absolute top-4 left-4 w-32 h-36 opacity-30" xmlns="http://www.w3.org/2000/svg">
              <polygon points="40,10 55,40 50,38 60,60 52,58 65,85 15,85 28,58 20,60 30,38 25,40" 
                       fill="hsl(140, 50%, 40%)" />
              <rect x="35" y="85" width="10" height="18" fill="hsl(30, 50%, 35%)" />
            </svg>
            {/* Top right mountain */}
            <svg className="absolute top-4 right-4 w-32 h-28 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,15 95,70 25,70" fill="none" stroke="hsl(200, 30%, 50%)" strokeWidth="2" />
              <polygon points="60,25 80,70 40,70" fill="hsl(200, 25%, 55%)" opacity="0.4" />
              {/* Birds */}
              <path d="M20 25 Q25 20, 30 25" stroke="hsl(220, 30%, 40%)" strokeWidth="1.5" fill="none" />
              <path d="M25 32 Q30 27, 35 32" stroke="hsl(220, 30%, 40%)" strokeWidth="1.5" fill="none" />
            </svg>
            {/* Bottom left leaves */}
            <svg className="absolute bottom-4 left-4 w-28 h-28 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="35" cy="70" rx="18" ry="10" fill="hsl(120, 45%, 45%)" transform="rotate(-30 35 70)" />
              <line x1="22" y1="76" x2="48" y2="64" stroke="hsl(120, 40%, 35%)" strokeWidth="1.5" />
              <ellipse cx="60" cy="85" rx="14" ry="8" fill="hsl(130, 42%, 48%)" transform="rotate(15 60 85)" />
            </svg>
            {/* Bottom right flower */}
            <svg className="absolute bottom-4 right-4 w-24 h-24 opacity-25" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="55" r="10" fill="hsl(340, 60%, 60%)" />
              <circle cx="42" cy="50" r="8" fill="hsl(350, 55%, 65%)" />
              <circle cx="58" cy="50" r="8" fill="hsl(350, 55%, 65%)" />
              <circle cx="50" cy="43" r="8" fill="hsl(350, 55%, 65%)" />
              <circle cx="50" cy="55" r="4" fill="hsl(45, 80%, 55%)" />
            </svg>
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-36 h-36 rounded-full bg-green-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full bg-teal-400/10 blur-3xl" />
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
