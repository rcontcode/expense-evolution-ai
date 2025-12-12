import { useTheme } from '@/contexts/ThemeContext';

export const ThemeBackground = () => {
  const { style } = useTheme();

  const renderPattern = () => {
    switch (style) {
      case 'spring':
        return (
          <>
            {/* Left edge decorations */}
            <svg className="absolute top-20 -left-8 w-80 h-96 opacity-50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="25" fill="hsl(350, 80%, 75%)" />
              <circle cx="30" cy="50" r="18" fill="hsl(350, 70%, 80%)" />
              <circle cx="70" cy="50" r="18" fill="hsl(350, 70%, 80%)" />
              <circle cx="50" cy="30" r="18" fill="hsl(350, 70%, 80%)" />
              <circle cx="50" cy="70" r="18" fill="hsl(350, 70%, 80%)" />
              <circle cx="50" cy="50" r="10" fill="hsl(45, 90%, 70%)" />
              
              <circle cx="30" cy="150" r="20" fill="hsl(340, 75%, 78%)" />
              <circle cx="15" cy="150" r="14" fill="hsl(340, 70%, 82%)" />
              <circle cx="45" cy="150" r="14" fill="hsl(340, 70%, 82%)" />
              <circle cx="30" cy="135" r="14" fill="hsl(340, 70%, 82%)" />
              <circle cx="30" cy="150" r="8" fill="hsl(50, 85%, 68%)" />
              
              <ellipse cx="60" cy="120" rx="30" ry="12" fill="hsl(120, 50%, 55%)" transform="rotate(-30 60 120)" />
              <ellipse cx="40" cy="220" rx="25" ry="10" fill="hsl(130, 45%, 58%)" transform="rotate(-20 40 220)" />
              <ellipse cx="70" cy="280" rx="28" ry="11" fill="hsl(125, 48%, 52%)" transform="rotate(-35 70 280)" />
              
              <circle cx="80" cy="200" r="18" fill="hsl(330, 70%, 82%)" />
              <circle cx="45" cy="320" r="15" fill="hsl(345, 75%, 78%)" />
            </svg>
            
            {/* Right edge decorations */}
            <svg className="absolute top-40 -right-10 w-72 h-80 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <circle cx="220" cy="40" r="22" fill="hsl(340, 75%, 78%)" />
              <circle cx="205" cy="40" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="235" cy="40" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="220" cy="25" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="220" cy="40" r="8" fill="hsl(48, 88%, 68%)" />
              
              <ellipse cx="200" cy="100" rx="28" ry="10" fill="hsl(130, 50%, 55%)" transform="rotate(25 200 100)" />
              <ellipse cx="230" cy="160" rx="24" ry="9" fill="hsl(125, 45%, 58%)" transform="rotate(15 230 160)" />
              
              <circle cx="210" cy="220" r="16" fill="hsl(350, 72%, 80%)" />
              <circle cx="240" cy="280" r="12" fill="hsl(335, 68%, 78%)" />
            </svg>
            
            {/* Bottom edge decorations */}
            <svg className="absolute -bottom-10 left-1/4 w-96 h-48 opacity-40" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="100" rx="40" ry="15" fill="hsl(130, 50%, 55%)" transform="rotate(-10 50 100)" />
              <ellipse cx="150" cy="120" rx="35" ry="12" fill="hsl(125, 48%, 58%)" transform="rotate(8 150 120)" />
              <ellipse cx="280" cy="110" rx="38" ry="14" fill="hsl(135, 45%, 52%)" transform="rotate(-5 280 110)" />
              
              <circle cx="100" cy="80" r="20" fill="hsl(350, 75%, 78%)" />
              <circle cx="220" cy="90" r="18" fill="hsl(340, 72%, 80%)" />
              <circle cx="330" cy="85" r="15" fill="hsl(345, 70%, 82%)" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-pink-400/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-green-400/20 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-pink-300/20 blur-3xl" />
          </>
        );

      case 'summer':
        return (
          <>
            {/* Top right large sun */}
            <svg className="absolute -top-10 -right-10 w-72 h-72 opacity-50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="180" cy="80" r="50" fill="hsl(45, 95%, 60%)" />
              <g stroke="hsl(45, 95%, 55%)" strokeWidth="5" fill="none">
                <line x1="180" y1="15" x2="180" y2="35" />
                <line x1="180" y1="125" x2="180" y2="145" />
                <line x1="115" y1="80" x2="135" y2="80" />
                <line x1="225" y1="80" x2="245" y2="80" />
                <line x1="134" y1="34" x2="148" y2="48" />
                <line x1="212" y1="112" x2="226" y2="126" />
                <line x1="134" y1="126" x2="148" y2="112" />
                <line x1="212" y1="48" x2="226" y2="34" />
              </g>
            </svg>
            
            {/* Left palm trees */}
            <svg className="absolute top-32 -left-6 w-48 h-72 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <rect x="35" y="120" width="12" height="150" fill="hsl(30, 50%, 35%)" />
              <path d="M5 130 Q50 80, 85 100" stroke="hsl(120, 45%, 40%)" strokeWidth="8" fill="none" />
              <path d="M10 115 Q45 70, 75 85" stroke="hsl(130, 40%, 45%)" strokeWidth="6" fill="none" />
              <path d="M15 140 Q45 100, 90 130" stroke="hsl(125, 42%, 42%)" strokeWidth="7" fill="none" />
              <path d="M20 125 Q50 90, 80 110" stroke="hsl(118, 38%, 48%)" strokeWidth="5" fill="none" />
            </svg>
            
            {/* Bottom ocean waves */}
            <svg className="absolute bottom-0 left-0 w-full h-40 opacity-45" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 60 Q80 30, 160 60 T320 60 T480 60 T640 60 T800 60 T960 60 T1120 60 T1280 60 T1440 60 T1600 60" 
                    stroke="hsl(195, 85%, 55%)" strokeWidth="8" fill="none" />
              <path d="M0 90 Q80 60, 160 90 T320 90 T480 90 T640 90 T800 90 T960 90 T1120 90 T1280 90" 
                    stroke="hsl(200, 80%, 50%)" strokeWidth="5" fill="none" />
              <path d="M0 115 Q80 90, 160 115 T320 115 T480 115 T640 115 T800 115 T960 115" 
                    stroke="hsl(205, 75%, 60%)" strokeWidth="3" fill="none" opacity="0.7" />
            </svg>
            
            {/* Right side beach elements */}
            <svg className="absolute bottom-40 -right-8 w-48 h-48 opacity-40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="120" cy="100" r="35" fill="hsl(50, 45%, 75%)" />
              <path d="M100 95 L150 60 L155 62 L108 98 Z" fill="hsl(35, 70%, 50%)" />
              <path d="M105 100 L155 62" stroke="hsl(0, 80%, 55%)" strokeWidth="3" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-yellow-400/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-cyan-400/20 blur-2xl" />
            <div className="absolute top-1/3 -left-20 w-40 h-60 rounded-full bg-green-400/15 blur-3xl" />
          </>
        );

      case 'autumn':
        return (
          <>
            {/* Left falling leaves */}
            <svg className="absolute top-10 -left-8 w-80 h-[500px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 40 L58 25 L66 40 L82 32 L74 48 L90 58 L74 66 L82 82 L66 74 L58 90 L50 74 L34 82 L42 66 L26 58 L42 48 L34 32 Z" 
                    fill="hsl(25, 85%, 50%)" transform="rotate(15 58 58)" />
              
              <path d="M40 160 L48 145 L56 160 L72 152 L64 168 L80 178 L64 186 L72 202 L56 194 L48 210 L40 194 L24 202 L32 186 L16 178 L32 168 L24 152 Z" 
                    fill="hsl(35, 90%, 52%)" transform="rotate(-20 48 178)" />
              
              <path d="M70 280 L78 265 L86 280 L102 272 L94 288 L110 298 L94 306 L102 322 L86 314 L78 330 L70 314 L54 322 L62 306 L46 298 L62 288 L54 272 Z" 
                    fill="hsl(20, 88%, 48%)" transform="rotate(25 78 298)" />
              
              <ellipse cx="30" cy="120" rx="20" ry="10" fill="hsl(30, 80%, 45%)" transform="rotate(-25 30 120)" />
              <ellipse cx="60" cy="230" rx="22" ry="11" fill="hsl(25, 75%, 50%)" transform="rotate(15 60 230)" />
              <ellipse cx="45" cy="380" rx="18" ry="9" fill="hsl(35, 82%, 48%)" transform="rotate(-10 45 380)" />
              
              <circle cx="80" cy="80" r="12" fill="hsl(40, 85%, 55%)" />
              <circle cx="25" cy="320" r="10" fill="hsl(28, 80%, 52%)" />
              <circle cx="70" cy="420" r="14" fill="hsl(32, 88%, 50%)" />
            </svg>
            
            {/* Right falling leaves */}
            <svg className="absolute top-20 -right-10 w-72 h-[450px] opacity-45" xmlns="http://www.w3.org/2000/svg">
              <path d="M200 50 L208 35 L216 50 L232 42 L224 58 L240 68 L224 76 L232 92 L216 84 L208 100 L200 84 L184 92 L192 76 L176 68 L192 58 L184 42 Z" 
                    fill="hsl(35, 90%, 55%)" transform="rotate(-15 208 68)" />
              
              <path d="M220 180 L228 165 L236 180 L252 172 L244 188 L260 198 L244 206 L252 222 L236 214 L228 230 L220 214 L204 222 L212 206 L196 198 L212 188 L204 172 Z" 
                    fill="hsl(25, 85%, 50%)" transform="rotate(20 228 198)" />
              
              <ellipse cx="190" cy="120" rx="24" ry="12" fill="hsl(28, 78%, 48%)" transform="rotate(30 190 120)" />
              <ellipse cx="230" cy="280" rx="20" ry="10" fill="hsl(32, 82%, 52%)" transform="rotate(-18 230 280)" />
              
              <circle cx="210" cy="340" r="15" fill="hsl(38, 88%, 54%)" />
              <circle cx="180" cy="400" r="11" fill="hsl(22, 84%, 48%)" />
            </svg>
            
            {/* Bottom ground leaves */}
            <svg className="absolute -bottom-8 left-0 w-full h-48 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <ellipse cx="10%" cy="120" rx="40" ry="18" fill="hsl(25, 80%, 48%)" transform="rotate(-15)" />
              <ellipse cx="25%" cy="140" rx="35" ry="15" fill="hsl(35, 85%, 52%)" transform="rotate(10)" />
              <ellipse cx="45%" cy="130" rx="42" ry="17" fill="hsl(28, 78%, 50%)" transform="rotate(-8)" />
              <ellipse cx="65%" cy="145" rx="38" ry="16" fill="hsl(32, 82%, 48%)" transform="rotate(12)" />
              <ellipse cx="85%" cy="125" rx="36" ry="14" fill="hsl(22, 80%, 52%)" transform="rotate(-5)" />
            </svg>
            
            {/* Warm corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-600/20 blur-3xl" />
            <div className="absolute top-1/2 -right-20 w-48 h-96 rounded-full bg-orange-400/15 blur-3xl" />
          </>
        );

      case 'winter':
        return (
          <>
            {/* Left snowflakes */}
            <svg className="absolute top-10 -left-4 w-72 h-[500px] opacity-55" xmlns="http://www.w3.org/2000/svg">
              <g stroke="hsl(210, 60%, 85%)" strokeWidth="3" fill="none">
                <line x1="50" y1="20" x2="50" y2="80" />
                <line x1="23" y1="35" x2="77" y2="65" />
                <line x1="23" y1="65" x2="77" y2="35" />
                <line x1="40" y1="28" x2="50" y2="38" />
                <line x1="60" y1="28" x2="50" y2="38" />
                <line x1="40" y1="72" x2="50" y2="62" />
                <line x1="60" y1="72" x2="50" y2="62" />
              </g>
              
              <g stroke="hsl(200, 55%, 82%)" strokeWidth="2.5" fill="none" transform="translate(30, 150)">
                <line x1="30" y1="0" x2="30" y2="50" />
                <line x1="8" y1="12" x2="52" y2="38" />
                <line x1="8" y1="38" x2="52" y2="12" />
              </g>
              
              <g stroke="hsl(205, 50%, 88%)" strokeWidth="2" fill="none" transform="translate(50, 280)">
                <line x1="25" y1="0" x2="25" y2="40" />
                <line x1="7" y1="10" x2="43" y2="30" />
                <line x1="7" y1="30" x2="43" y2="10" />
              </g>
              
              <circle cx="80" cy="120" r="6" fill="hsl(210, 40%, 92%)" />
              <circle cx="40" cy="240" r="5" fill="hsl(205, 45%, 90%)" />
              <circle cx="70" cy="350" r="7" fill="hsl(210, 38%, 88%)" />
              <circle cx="30" cy="420" r="4" fill="hsl(200, 42%, 92%)" />
            </svg>
            
            {/* Right snowflakes */}
            <svg className="absolute top-20 -right-8 w-64 h-[450px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <g stroke="hsl(200, 55%, 85%)" strokeWidth="3" fill="none" transform="translate(180, 30)">
                <line x1="30" y1="0" x2="30" y2="60" />
                <line x1="5" y1="15" x2="55" y2="45" />
                <line x1="5" y1="45" x2="55" y2="15" />
                <line x1="18" y1="8" x2="30" y2="20" />
                <line x1="42" y1="8" x2="30" y2="20" />
                <line x1="18" y1="52" x2="30" y2="40" />
                <line x1="42" y1="52" x2="30" y2="40" />
              </g>
              
              <g stroke="hsl(210, 50%, 82%)" strokeWidth="2" fill="none" transform="translate(160, 180)">
                <line x1="25" y1="0" x2="25" y2="45" />
                <line x1="5" y1="12" x2="45" y2="33" />
                <line x1="5" y1="33" x2="45" y2="12" />
              </g>
              
              <circle cx="200" cy="140" r="5" fill="hsl(210, 42%, 90%)" />
              <circle cx="220" cy="280" r="6" fill="hsl(205, 38%, 88%)" />
              <circle cx="180" cy="350" r="4" fill="hsl(200, 45%, 92%)" />
            </svg>
            
            {/* Bottom snow drift */}
            <svg className="absolute -bottom-4 left-0 w-full h-32 opacity-45" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 80 Q100 40, 200 70 T400 60 T600 75 T800 55 T1000 70 T1200 65 T1400 80 L1400 150 L0 150 Z" 
                    fill="hsl(210, 30%, 95%)" />
              <circle cx="15%" cy="90" r="4" fill="hsl(210, 35%, 88%)" />
              <circle cx="35%" cy="75" r="5" fill="hsl(205, 40%, 90%)" />
              <circle cx="60%" cy="85" r="3" fill="hsl(210, 38%, 92%)" />
              <circle cx="80%" cy="70" r="4" fill="hsl(200, 42%, 88%)" />
            </svg>
            
            {/* Icy corner glows */}
            <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-blue-200/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-cyan-100/25 blur-3xl" />
            <div className="absolute top-1/3 -right-20 w-48 h-80 rounded-full bg-blue-100/20 blur-3xl" />
          </>
        );

      case 'crypto':
        return (
          <>
            {/* Left blockchain network */}
            <svg className="absolute top-20 -left-6 w-72 h-[400px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="12" fill="hsl(45, 90%, 58%)" />
              <circle cx="90" cy="30" r="8" fill="hsl(50, 85%, 55%)" />
              <circle cx="40" cy="100" r="10" fill="hsl(45, 85%, 60%)" />
              <circle cx="100" cy="90" r="7" fill="hsl(48, 88%, 56%)" />
              <line x1="50" y1="50" x2="90" y2="30" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" />
              <line x1="50" y1="50" x2="40" y2="100" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" />
              <line x1="50" y1="50" x2="100" y2="90" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" />
              <line x1="40" y1="100" x2="100" y2="90" stroke="hsl(45, 80%, 50%)" strokeWidth="1.5" opacity="0.4" />
              
              <circle cx="60" cy="180" r="9" fill="hsl(45, 88%, 58%)" />
              <circle cx="30" cy="220" r="11" fill="hsl(50, 85%, 55%)" />
              <circle cx="85" cy="240" r="8" fill="hsl(48, 82%, 60%)" />
              <line x1="60" y1="180" x2="30" y2="220" stroke="hsl(45, 78%, 52%)" strokeWidth="1.5" opacity="0.5" />
              <line x1="60" y1="180" x2="85" y2="240" stroke="hsl(45, 78%, 52%)" strokeWidth="1.5" opacity="0.5" />
              
              <circle cx="45" cy="320" r="10" fill="hsl(45, 90%, 56%)" />
              <circle cx="80" cy="350" r="7" fill="hsl(50, 85%, 58%)" />
            </svg>
            
            {/* Right Bitcoin symbols */}
            <svg className="absolute top-10 -right-8 w-64 h-80 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="60" r="40" stroke="hsl(38, 95%, 55%)" strokeWidth="4" fill="none" />
              <text x="182" y="75" fill="hsl(38, 95%, 55%)" fontSize="40" fontWeight="bold">₿</text>
              
              <circle cx="180" cy="180" r="30" stroke="hsl(190, 80%, 50%)" strokeWidth="3" fill="none" />
              <text x="167" y="192" fill="hsl(190, 80%, 50%)" fontSize="28" fontWeight="bold">Ξ</text>
              
              <circle cx="210" cy="280" r="25" stroke="hsl(45, 85%, 55%)" strokeWidth="2.5" fill="none" />
            </svg>
            
            {/* Bottom decoration */}
            <svg className="absolute -bottom-4 left-0 w-full h-24 opacity-35" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="0" y1="60" x2="100%" y2="60" stroke="hsl(45, 75%, 50%)" strokeWidth="1" strokeDasharray="20,15" />
              <circle cx="15%" cy="60" r="8" fill="hsl(45, 88%, 58%)" />
              <circle cx="40%" cy="60" r="6" fill="hsl(50, 85%, 55%)" />
              <circle cx="70%" cy="60" r="7" fill="hsl(45, 82%, 60%)" />
              <circle cx="90%" cy="60" r="5" fill="hsl(48, 88%, 56%)" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-yellow-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-yellow-400/15 blur-3xl" />
          </>
        );

      case 'gaming':
        return (
          <>
            {/* Left pixel art */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px] opacity-55" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="20" height="20" fill="hsl(280, 85%, 60%)" />
              <rect x="42" y="20" width="20" height="20" fill="hsl(320, 80%, 55%)" />
              <rect x="64" y="20" width="20" height="20" fill="hsl(195, 85%, 55%)" />
              <rect x="20" y="42" width="20" height="20" fill="hsl(260, 75%, 65%)" />
              <rect x="42" y="42" width="20" height="20" fill="hsl(145, 70%, 55%)" />
              <rect x="64" y="42" width="20" height="20" fill="hsl(45, 90%, 60%)" />
              
              <rect x="30" y="100" width="16" height="16" fill="hsl(320, 80%, 55%)" />
              <rect x="48" y="100" width="16" height="16" fill="hsl(280, 85%, 60%)" />
              <rect x="30" y="118" width="16" height="16" fill="hsl(195, 85%, 55%)" />
              <rect x="48" y="118" width="16" height="16" fill="hsl(145, 70%, 55%)" />
              
              <polygon points="60,180 70,160 80,180 75,180 75,200 65,200 65,180" fill="hsl(45, 90%, 60%)" />
              
              <rect x="25" y="240" width="50" height="12" fill="hsl(270, 60%, 55%)" rx="3" />
              <rect x="45" y="225" width="12" height="42" fill="hsl(270, 60%, 55%)" rx="3" />
              
              <polygon points="55,320 60,300 65,320 85,315 75,330 90,345 72,345 65,365 60,345 48,345 30,345 45,330 35,315" fill="hsl(45, 92%, 55%)" />
            </svg>
            
            {/* Right controller elements */}
            <svg className="absolute top-20 -right-8 w-64 h-80 opacity-50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="180" cy="50" r="22" stroke="hsl(280, 70%, 60%)" strokeWidth="4" fill="none" />
              <circle cx="220" cy="90" r="22" stroke="hsl(320, 75%, 55%)" strokeWidth="4" fill="none" />
              <circle cx="140" cy="90" r="22" stroke="hsl(180, 80%, 50%)" strokeWidth="4" fill="none" />
              <circle cx="180" cy="130" r="22" stroke="hsl(140, 70%, 50%)" strokeWidth="4" fill="none" />
              
              <rect x="150" y="180" width="60" height="18" fill="hsl(270, 60%, 55%)" rx="4" />
              <rect x="172" y="162" width="18" height="54" fill="hsl(270, 60%, 55%)" rx="4" />
              
              <rect x="170" y="260" width="40" height="25" rx="6" stroke="hsl(0, 0%, 60%)" strokeWidth="3" fill="none" />
              <rect x="165" y="275" width="10" height="30" rx="3" fill="hsl(0, 0%, 50%)" />
              <rect x="215" y="275" width="10" height="30" rx="3" fill="hsl(0, 0%, 50%)" />
            </svg>
            
            {/* Bottom health bar style */}
            <svg className="absolute -bottom-2 left-0 w-full h-20 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <rect x="5%" y="40" width="25%" height="12" rx="6" fill="hsl(0, 0%, 30%)" />
              <rect x="5%" y="40" width="20%" height="12" rx="6" fill="hsl(140, 70%, 50%)" />
              <rect x="35%" y="40" width="25%" height="12" rx="6" fill="hsl(0, 0%, 30%)" />
              <rect x="35%" y="40" width="15%" height="12" rx="6" fill="hsl(200, 80%, 55%)" />
            </svg>
            
            {/* Neon corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-pink-500/25 blur-3xl" />
            <div className="absolute top-1/2 -right-20 w-48 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
          </>
        );

      case 'sports':
        return (
          <>
            {/* Left sports balls */}
            <svg className="absolute top-10 -left-6 w-72 h-[400px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="40" stroke="hsl(145, 70%, 40%)" strokeWidth="4" fill="none" />
              <polygon points="60,28 78,48 72,72 48,72 42,48" stroke="hsl(145, 70%, 40%)" strokeWidth="3" fill="none" />
              
              <circle cx="50" cy="180" r="35" stroke="hsl(25, 90%, 50%)" strokeWidth="4" fill="none" />
              <path d="M15 180 Q50 160, 85 180" stroke="hsl(25, 90%, 50%)" strokeWidth="3" fill="none" />
              <line x1="50" y1="145" x2="50" y2="215" stroke="hsl(25, 90%, 50%)" strokeWidth="3" />
              
              <ellipse cx="55" cy="300" rx="45" ry="28" stroke="hsl(30, 60%, 35%)" strokeWidth="3" fill="none" />
              <path d="M20 300 Q55 280, 90 300 Q55 320, 20 300" stroke="hsl(30, 60%, 35%)" strokeWidth="2" fill="none" />
            </svg>
            
            {/* Right sports elements */}
            <svg className="absolute top-20 -right-8 w-64 h-80 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <circle cx="180" cy="60" r="32" stroke="hsl(65, 80%, 50%)" strokeWidth="4" fill="none" />
              <path d="M160 38 Q180 60, 160 82" stroke="hsl(65, 80%, 50%)" strokeWidth="3" fill="none" />
              <path d="M200 38 Q180 60, 200 82" stroke="hsl(65, 80%, 50%)" strokeWidth="3" fill="none" />
              
              <rect x="160" y="140" width="60" height="100" stroke="hsl(0, 75%, 50%)" strokeWidth="3" fill="none" />
              <rect x="175" y="155" width="30" height="25" stroke="hsl(0, 75%, 50%)" strokeWidth="2" fill="none" />
              <line x1="190" y1="180" x2="190" y2="240" stroke="hsl(0, 0%, 95%)" strokeWidth="2" strokeDasharray="8,4" />
              
              <circle cx="200" cy="290" r="25" stroke="hsl(0, 0%, 95%)" strokeWidth="3" fill="none" />
              <path d="M180 280 Q200 295, 220 280" stroke="hsl(0, 70%, 45%)" strokeWidth="2" fill="none" />
            </svg>
            
            {/* Bottom field lines */}
            <svg className="absolute -bottom-2 left-0 w-full h-24 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="100%" y2="50" stroke="hsl(145, 60%, 45%)" strokeWidth="6" strokeDasharray="30,20" />
              <line x1="0" y1="70" x2="100%" y2="70" stroke="hsl(145, 55%, 50%)" strokeWidth="3" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-orange-400/20 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-green-400/15 blur-3xl" />
          </>
        );

      case 'music':
        return (
          <>
            {/* Left music notes */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px] opacity-55" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="80" rx="25" ry="15" fill="hsl(280, 75%, 55%)" transform="rotate(-20 50 80)" />
              <line x1="72" y1="72" x2="72" y2="20" stroke="hsl(280, 75%, 55%)" strokeWidth="5" />
              <path d="M72 20 Q110 35, 95 65" stroke="hsl(280, 75%, 55%)" strokeWidth="5" fill="none" />
              
              <ellipse cx="40" cy="180" rx="20" ry="12" fill="hsl(320, 70%, 50%)" transform="rotate(-20 40 180)" />
              <line x1="58" y1="174" x2="58" y2="130" stroke="hsl(320, 70%, 50%)" strokeWidth="4" />
              
              <ellipse cx="60" cy="280" rx="22" ry="14" fill="hsl(260, 70%, 55%)" transform="rotate(-15 60 280)" />
              <ellipse cx="95" cy="270" rx="22" ry="14" fill="hsl(260, 70%, 55%)" transform="rotate(-15 95 270)" />
              <line x1="80" y1="274" x2="80" y2="210" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
              <line x1="115" y1="264" x2="115" y2="200" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
              <line x1="80" y1="210" x2="115" y2="200" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
              
              <ellipse cx="45" cy="370" rx="18" ry="11" fill="hsl(290, 65%, 52%)" transform="rotate(-20 45 370)" />
              <line x1="61" y1="364" x2="61" y2="325" stroke="hsl(290, 65%, 52%)" strokeWidth="3" />
            </svg>
            
            {/* Right equalizer and elements */}
            <svg className="absolute top-20 -right-6 w-64 h-80 opacity-50" xmlns="http://www.w3.org/2000/svg">
              <rect x="140" y="40" width="14" height="60" fill="hsl(300, 70%, 55%)" rx="4" />
              <rect x="160" y="20" width="14" height="80" fill="hsl(280, 65%, 60%)" rx="4" />
              <rect x="180" y="50" width="14" height="50" fill="hsl(320, 75%, 50%)" rx="4" />
              <rect x="200" y="30" width="14" height="70" fill="hsl(290, 70%, 55%)" rx="4" />
              <rect x="220" y="45" width="14" height="55" fill="hsl(270, 68%, 58%)" rx="4" />
              
              <circle cx="180" cy="170" r="35" stroke="hsl(280, 70%, 55%)" strokeWidth="5" fill="none" />
              <circle cx="180" cy="170" r="15" fill="hsl(280, 70%, 55%)" />
              
              <path d="M140 250 Q170 230, 200 250 T260 250" stroke="hsl(260, 65%, 60%)" strokeWidth="4" fill="none" />
              <path d="M130 280 Q175 255, 220 280 T310 280" stroke="hsl(290, 60%, 55%)" strokeWidth="3" fill="none" />
            </svg>
            
            {/* Bottom sound waves */}
            <svg className="absolute -bottom-2 left-0 w-full h-24 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 50 Q50 30, 100 50 T200 50 T300 50 T400 50 T500 50 T600 50 T700 50 T800 50" 
                    stroke="hsl(280, 70%, 55%)" strokeWidth="4" fill="none" />
              <path d="M0 70 Q60 50, 120 70 T240 70 T360 70 T480 70 T600 70 T720 70" 
                    stroke="hsl(320, 65%, 50%)" strokeWidth="2.5" fill="none" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-pink-500/25 blur-3xl" />
            <div className="absolute top-1/3 -right-20 w-48 h-80 rounded-full bg-violet-500/15 blur-3xl" />
          </>
        );

      case 'coffee':
        return (
          <>
            {/* Left coffee cups */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 60 L22 130 Q22 150 50 150 Q78 150 78 130 L70 60 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <ellipse cx="50" cy="60" rx="22" ry="10" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <path d="M78 75 Q100 75, 100 100 Q100 120, 78 120" stroke="hsl(25, 55%, 45%)" strokeWidth="4" fill="none" />
              <path d="M35 45 Q40 25, 50 30 Q55 25, 60 35" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M45 40 Q50 20, 55 25" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" opacity="0.7" />
              
              <circle cx="40" cy="220" r="20" fill="hsl(25, 70%, 25%)" />
              <circle cx="65" cy="230" r="18" fill="hsl(25, 65%, 28%)" />
              <circle cx="55" cy="205" r="16" fill="hsl(25, 68%, 22%)" />
              <circle cx="80" cy="210" r="14" fill="hsl(25, 72%, 30%)" />
              
              <path d="M25 300 L20 350 Q20 365 45 365 Q70 365 70 350 L65 300 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="3" fill="none" />
              <ellipse cx="45" cy="300" rx="22" ry="8" stroke="hsl(25, 60%, 40%)" strokeWidth="3" fill="none" />
              <path d="M30 285 Q35 265, 45 270 Q50 262, 55 275" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" opacity="0.6" />
            </svg>
            
            {/* Right coffee elements */}
            <svg className="absolute top-20 -right-6 w-64 h-80 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <path d="M160 50 L152 120 Q152 140 185 140 Q218 140 218 120 L210 50 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <ellipse cx="185" cy="50" rx="28" ry="12" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <path d="M218 65 Q245 65, 245 95 Q245 120, 218 120" stroke="hsl(25, 55%, 45%)" strokeWidth="4" fill="none" />
              
              <circle cx="170" cy="200" r="22" fill="hsl(25, 70%, 25%)" />
              <circle cx="200" cy="195" r="20" fill="hsl(25, 65%, 28%)" />
              <circle cx="185" cy="220" r="18" fill="hsl(25, 68%, 22%)" />
              <circle cx="220" cy="215" r="16" fill="hsl(25, 72%, 30%)" />
              
              <text x="170" y="300" fill="hsl(25, 50%, 40%)" fontSize="24" fontFamily="serif" fontStyle="italic">Coffee</text>
            </svg>
            
            {/* Bottom coffee beans */}
            <svg className="absolute -bottom-4 left-0 w-full h-28 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <ellipse cx="10%" cy="80" rx="25" ry="15" fill="hsl(25, 70%, 25%)" transform="rotate(-20)" />
              <ellipse cx="25%" cy="90" rx="22" ry="13" fill="hsl(25, 65%, 28%)" transform="rotate(15)" />
              <ellipse cx="45%" cy="75" rx="24" ry="14" fill="hsl(25, 68%, 22%)" transform="rotate(-10)" />
              <ellipse cx="65%" cy="85" rx="20" ry="12" fill="hsl(25, 72%, 30%)" transform="rotate(25)" />
              <ellipse cx="85%" cy="80" rx="23" ry="14" fill="hsl(25, 66%, 26%)" transform="rotate(-15)" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-amber-600/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-orange-800/20 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-amber-500/15 blur-3xl" />
          </>
        );

      case 'nature':
        return (
          <>
            {/* Left trees and plants */}
            <svg className="absolute top-10 -left-6 w-80 h-[450px] opacity-50" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,40 20,120 45,120 15,180 50,180 60,180 95,180 130,180 95,120 120,120 80,40" fill="hsl(140, 50%, 35%)" />
              <rect x="55" y="180" width="15" height="50" fill="hsl(25, 50%, 30%)" />
              
              <polygon points="45,250 15,310 35,310 10,360 40,360 50,360 80,360 110,360 85,310 105,310 75,250" fill="hsl(145, 45%, 40%)" />
              <rect x="42" y="360" width="12" height="35" fill="hsl(25, 45%, 32%)" />
              
              <ellipse cx="100" cy="200" rx="8" ry="35" fill="hsl(130, 55%, 40%)" transform="rotate(-15 100 200)" />
              <ellipse cx="115" cy="210" rx="7" ry="30" fill="hsl(135, 50%, 45%)" transform="rotate(10 115 210)" />
              <ellipse cx="90" cy="215" rx="6" ry="28" fill="hsl(140, 52%, 38%)" transform="rotate(-25 90 215)" />
            </svg>
            
            {/* Right nature elements */}
            <svg className="absolute top-20 -right-8 w-72 h-80 opacity-45" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="60" r="40" fill="hsl(45, 95%, 60%)" />
              <g stroke="hsl(45, 95%, 55%)" strokeWidth="4" fill="none">
                <line x1="200" y1="10" x2="200" y2="25" />
                <line x1="200" y1="95" x2="200" y2="110" />
                <line x1="150" y1="60" x2="165" y2="60" />
                <line x1="235" y1="60" x2="250" y2="60" />
                <line x1="165" y1="25" x2="175" y2="35" />
                <line x1="225" y1="85" x2="235" y2="95" />
                <line x1="165" y1="95" x2="175" y2="85" />
                <line x1="225" y1="35" x2="235" y2="25" />
              </g>
              
              <path d="M160 200 Q180 150, 200 200 Q220 150, 240 200" stroke="hsl(140, 45%, 45%)" strokeWidth="3" fill="none" />
              <path d="M170 250 Q185 210, 200 250 Q215 210, 230 250" stroke="hsl(145, 50%, 40%)" strokeWidth="2" fill="none" />
              
              <circle cx="180" cy="300" r="15" fill="hsl(0, 70%, 55%)" />
              <circle cx="210" cy="310" r="12" fill="hsl(40, 85%, 55%)" />
              <circle cx="195" cy="330" r="14" fill="hsl(280, 60%, 55%)" />
            </svg>
            
            {/* Bottom grass and flowers */}
            <svg className="absolute -bottom-4 left-0 w-full h-32 opacity-45" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 100 Q20 70, 30 100 Q40 60, 50 100 Q65 70, 75 100 Q85 55, 100 100 Q115 65, 130 100 Q140 70, 155 100 Q165 60, 180 100 Q195 70, 210 100 Q220 55, 235 100" 
                    stroke="hsl(140, 50%, 40%)" strokeWidth="3" fill="none" />
              
              <circle cx="15%" cy="85" r="8" fill="hsl(350, 70%, 60%)" />
              <circle cx="15%" cy="85" r="3" fill="hsl(45, 90%, 70%)" />
              
              <circle cx="35%" cy="75" r="10" fill="hsl(280, 60%, 60%)" />
              <circle cx="35%" cy="75" r="4" fill="hsl(50, 85%, 68%)" />
              
              <circle cx="55%" cy="88" r="7" fill="hsl(45, 85%, 60%)" />
              <circle cx="55%" cy="88" r="3" fill="hsl(25, 80%, 50%)" />
              
              <circle cx="75%" cy="78" r="9" fill="hsl(200, 70%, 60%)" />
              <circle cx="75%" cy="78" r="3" fill="hsl(45, 90%, 70%)" />
              
              <circle cx="90%" cy="82" r="8" fill="hsl(330, 65%, 60%)" />
              <circle cx="90%" cy="82" r="3" fill="hsl(50, 85%, 68%)" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-yellow-400/25 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-green-500/25 blur-3xl" />
            <div className="absolute top-1/3 -left-20 w-48 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
          </>
        );

      default:
        return null;
    }
  };

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
