import { useTheme } from '@/contexts/ThemeContext';

export const ThemeBackground = () => {
  const { style } = useTheme();

  const renderPattern = () => {
    switch (style) {
      case 'spring':
        return (
          <>
            {/* Left edge decorations - floating flowers */}
            <svg className="absolute top-20 -left-8 w-80 h-96 animate-float-slow" xmlns="http://www.w3.org/2000/svg">
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
            </svg>
            
            {/* Floating flower 2 */}
            <svg className="absolute top-60 -left-4 w-48 h-48 animate-float-delayed" style={{ animationDelay: '2s' }} xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="60" rx="30" ry="12" fill="hsl(120, 50%, 55%)" transform="rotate(-30 60 60)" className="animate-sway" />
              <ellipse cx="40" cy="100" rx="25" ry="10" fill="hsl(130, 45%, 58%)" transform="rotate(-20 40 100)" />
            </svg>
            
            {/* Right edge decorations */}
            <svg className="absolute top-40 -right-10 w-72 h-80 animate-float-delayed" style={{ animationDelay: '1s' }} xmlns="http://www.w3.org/2000/svg">
              <circle cx="220" cy="40" r="22" fill="hsl(340, 75%, 78%)" />
              <circle cx="205" cy="40" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="235" cy="40" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="220" cy="25" r="15" fill="hsl(340, 70%, 82%)" />
              <circle cx="220" cy="40" r="8" fill="hsl(48, 88%, 68%)" />
              
              <ellipse cx="200" cy="100" rx="28" ry="10" fill="hsl(130, 50%, 55%)" transform="rotate(25 200 100)" />
              <ellipse cx="230" cy="160" rx="24" ry="9" fill="hsl(125, 45%, 58%)" transform="rotate(15 230 160)" />
              
              <circle cx="210" cy="220" r="16" fill="hsl(350, 72%, 80%)" />
            </svg>
            
            {/* Bottom edge decorations */}
            <svg className="absolute -bottom-10 left-1/4 w-96 h-48 animate-sway" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="100" rx="40" ry="15" fill="hsl(130, 50%, 55%)" transform="rotate(-10 50 100)" />
              <ellipse cx="150" cy="120" rx="35" ry="12" fill="hsl(125, 48%, 58%)" transform="rotate(8 150 120)" />
              <ellipse cx="280" cy="110" rx="38" ry="14" fill="hsl(135, 45%, 52%)" transform="rotate(-5 280 110)" />
              
              <circle cx="100" cy="80" r="20" fill="hsl(350, 75%, 78%)" />
              <circle cx="220" cy="90" r="18" fill="hsl(340, 72%, 80%)" />
            </svg>
            
            {/* Animated corner glows */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-pink-400/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-green-400/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-pink-300/20 blur-3xl animate-drift" />
          </>
        );

      case 'summer':
        return (
          <>
            {/* Top right large sun with rays animation */}
            <svg className="absolute -top-10 -right-10 w-72 h-72" xmlns="http://www.w3.org/2000/svg">
              <circle cx="180" cy="80" r="50" fill="hsl(45, 95%, 60%)" className="animate-pulse-glow" />
              <g stroke="hsl(45, 95%, 55%)" strokeWidth="5" fill="none" className="animate-spin-slow" style={{ transformOrigin: '180px 80px' }}>
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
            
            {/* Left palm trees swaying */}
            <svg className="absolute top-32 -left-6 w-48 h-72 animate-sway" xmlns="http://www.w3.org/2000/svg">
              <rect x="35" y="120" width="12" height="150" fill="hsl(30, 50%, 35%)" />
              <g className="animate-sway" style={{ transformOrigin: '35px 120px' }}>
                <path d="M5 130 Q50 80, 85 100" stroke="hsl(120, 45%, 40%)" strokeWidth="8" fill="none" />
                <path d="M10 115 Q45 70, 75 85" stroke="hsl(130, 40%, 45%)" strokeWidth="6" fill="none" />
                <path d="M15 140 Q45 100, 90 130" stroke="hsl(125, 42%, 42%)" strokeWidth="7" fill="none" />
                <path d="M20 125 Q50 90, 80 110" stroke="hsl(118, 38%, 48%)" strokeWidth="5" fill="none" />
              </g>
            </svg>
            
            {/* Bottom ocean waves animated */}
            <svg className="absolute bottom-0 left-0 w-full h-40 animate-wave" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 60 Q80 30, 160 60 T320 60 T480 60 T640 60 T800 60 T960 60 T1120 60 T1280 60 T1440 60 T1600 60" 
                    stroke="hsl(195, 85%, 55%)" strokeWidth="8" fill="none" />
              <path d="M0 90 Q80 60, 160 90 T320 90 T480 90 T640 90 T800 90 T960 90 T1120 90 T1280 90" 
                    stroke="hsl(200, 80%, 50%)" strokeWidth="5" fill="none" className="animate-wave" style={{ animationDelay: '1s' }} />
              <path d="M0 115 Q80 90, 160 115 T320 115 T480 115 T640 115 T800 115 T960 115" 
                    stroke="hsl(205, 75%, 60%)" strokeWidth="3" fill="none" opacity="0.7" className="animate-wave" style={{ animationDelay: '2s' }} />
            </svg>
            
            {/* Animated corner glows */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-yellow-400/30 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-cyan-400/20 blur-2xl animate-shimmer" />
            <div className="absolute top-1/3 -left-20 w-40 h-60 rounded-full bg-green-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'autumn':
        return (
          <>
            {/* Left falling leaves with animation */}
            <svg className="absolute top-10 -left-8 w-80 h-[500px]" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-float-slow" style={{ animationDelay: '0s' }}>
                <path d="M50 40 L58 25 L66 40 L82 32 L74 48 L90 58 L74 66 L82 82 L66 74 L58 90 L50 74 L34 82 L42 66 L26 58 L42 48 L34 32 Z" 
                      fill="hsl(25, 85%, 50%)" transform="rotate(15 58 58)" />
              </g>
              
              <g className="animate-float-delayed" style={{ animationDelay: '1s' }}>
                <path d="M40 160 L48 145 L56 160 L72 152 L64 168 L80 178 L64 186 L72 202 L56 194 L48 210 L40 194 L24 202 L32 186 L16 178 L32 168 L24 152 Z" 
                      fill="hsl(35, 90%, 52%)" transform="rotate(-20 48 178)" />
              </g>
              
              <g className="animate-float-slow" style={{ animationDelay: '3s' }}>
                <path d="M70 280 L78 265 L86 280 L102 272 L94 288 L110 298 L94 306 L102 322 L86 314 L78 330 L70 314 L54 322 L62 306 L46 298 L62 288 L54 272 Z" 
                      fill="hsl(20, 88%, 48%)" transform="rotate(25 78 298)" />
              </g>
              
              <ellipse cx="30" cy="120" rx="20" ry="10" fill="hsl(30, 80%, 45%)" transform="rotate(-25 30 120)" className="animate-sway" />
              <ellipse cx="60" cy="230" rx="22" ry="11" fill="hsl(25, 75%, 50%)" transform="rotate(15 60 230)" className="animate-sway" style={{ animationDelay: '1.5s' }} />
              
              <circle cx="80" cy="80" r="12" fill="hsl(40, 85%, 55%)" className="animate-bounce-slow" />
              <circle cx="25" cy="320" r="10" fill="hsl(28, 80%, 52%)" className="animate-bounce-slow" style={{ animationDelay: '2s' }} />
            </svg>
            
            {/* Right falling leaves */}
            <svg className="absolute top-20 -right-10 w-72 h-[450px]" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-float-delayed" style={{ animationDelay: '0.5s' }}>
                <path d="M200 50 L208 35 L216 50 L232 42 L224 58 L240 68 L224 76 L232 92 L216 84 L208 100 L200 84 L184 92 L192 76 L176 68 L192 58 L184 42 Z" 
                      fill="hsl(35, 90%, 55%)" transform="rotate(-15 208 68)" />
              </g>
              
              <g className="animate-float-slow" style={{ animationDelay: '2.5s' }}>
                <path d="M220 180 L228 165 L236 180 L252 172 L244 188 L260 198 L244 206 L252 222 L236 214 L228 230 L220 214 L204 222 L212 206 L196 198 L212 188 L204 172 Z" 
                      fill="hsl(25, 85%, 50%)" transform="rotate(20 228 198)" />
              </g>
              
              <ellipse cx="190" cy="120" rx="24" ry="12" fill="hsl(28, 78%, 48%)" transform="rotate(30 190 120)" className="animate-sway" style={{ animationDelay: '2s' }} />
              
              <circle cx="210" cy="340" r="15" fill="hsl(38, 88%, 54%)" className="animate-bounce-slow" style={{ animationDelay: '1s' }} />
            </svg>
            
            {/* Warm corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-orange-500/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-600/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 -right-20 w-48 h-96 rounded-full bg-orange-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'winter':
        return (
          <>
            {/* Left snowflakes - falling animation */}
            <svg className="absolute top-0 -left-4 w-72 h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-fall-slow" style={{ animationDelay: '0s' }}>
                <g stroke="hsl(210, 60%, 85%)" strokeWidth="3" fill="none">
                  <line x1="50" y1="20" x2="50" y2="80" />
                  <line x1="23" y1="35" x2="77" y2="65" />
                  <line x1="23" y1="65" x2="77" y2="35" />
                  <line x1="40" y1="28" x2="50" y2="38" />
                  <line x1="60" y1="28" x2="50" y2="38" />
                  <line x1="40" y1="72" x2="50" y2="62" />
                  <line x1="60" y1="72" x2="50" y2="62" />
                </g>
              </g>
              
              <g className="animate-fall-slow" style={{ animationDelay: '5s' }}>
                <g stroke="hsl(200, 55%, 82%)" strokeWidth="2.5" fill="none" transform="translate(30, 0)">
                  <line x1="30" y1="0" x2="30" y2="50" />
                  <line x1="8" y1="12" x2="52" y2="38" />
                  <line x1="8" y1="38" x2="52" y2="12" />
                </g>
              </g>
              
              <g className="animate-fall-slow" style={{ animationDelay: '10s' }}>
                <g stroke="hsl(205, 50%, 88%)" strokeWidth="2" fill="none" transform="translate(70, 0)">
                  <line x1="25" y1="0" x2="25" y2="40" />
                  <line x1="7" y1="10" x2="43" y2="30" />
                  <line x1="7" y1="30" x2="43" y2="10" />
                </g>
              </g>
              
              <circle cx="80" cy="120" r="6" fill="hsl(210, 40%, 92%)" className="animate-fall-slow" style={{ animationDelay: '3s' }} />
              <circle cx="40" cy="240" r="5" fill="hsl(205, 45%, 90%)" className="animate-fall-slow" style={{ animationDelay: '7s' }} />
              <circle cx="70" cy="350" r="7" fill="hsl(210, 38%, 88%)" className="animate-fall-slow" style={{ animationDelay: '12s' }} />
            </svg>
            
            {/* Right snowflakes */}
            <svg className="absolute top-0 -right-8 w-64 h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-fall-slow" style={{ animationDelay: '2s' }}>
                <g stroke="hsl(200, 55%, 85%)" strokeWidth="3" fill="none" transform="translate(180, 0)">
                  <line x1="30" y1="0" x2="30" y2="60" />
                  <line x1="5" y1="15" x2="55" y2="45" />
                  <line x1="5" y1="45" x2="55" y2="15" />
                  <line x1="18" y1="8" x2="30" y2="20" />
                  <line x1="42" y1="8" x2="30" y2="20" />
                  <line x1="18" y1="52" x2="30" y2="40" />
                  <line x1="42" y1="52" x2="30" y2="40" />
                </g>
              </g>
              
              <g className="animate-fall-slow" style={{ animationDelay: '8s' }}>
                <g stroke="hsl(210, 50%, 82%)" strokeWidth="2" fill="none" transform="translate(160, 0)">
                  <line x1="25" y1="0" x2="25" y2="45" />
                  <line x1="5" y1="12" x2="45" y2="33" />
                  <line x1="5" y1="33" x2="45" y2="12" />
                </g>
              </g>
              
              <circle cx="200" cy="140" r="5" fill="hsl(210, 42%, 90%)" className="animate-fall-slow" style={{ animationDelay: '4s' }} />
              <circle cx="220" cy="280" r="6" fill="hsl(205, 38%, 88%)" className="animate-fall-slow" style={{ animationDelay: '9s' }} />
            </svg>
            
            {/* Bottom snow drift with shimmer */}
            <svg className="absolute -bottom-4 left-0 w-full h-32" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 80 Q100 40, 200 70 T400 60 T600 75 T800 55 T1000 70 T1200 65 T1400 80 L1400 150 L0 150 Z" 
                    fill="hsl(210, 30%, 95%)" className="animate-shimmer" />
            </svg>
            
            {/* Icy corner glows */}
            <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-blue-200/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-cyan-100/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/3 -right-20 w-48 h-80 rounded-full bg-blue-100/20 blur-3xl animate-drift" />
          </>
        );

      case 'crypto':
        return (
          <>
            {/* Left blockchain network with pulse */}
            <svg className="absolute top-20 -left-6 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="12" fill="hsl(45, 90%, 58%)" className="animate-pulse-glow" />
              <circle cx="90" cy="30" r="8" fill="hsl(50, 85%, 55%)" className="animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
              <circle cx="40" cy="100" r="10" fill="hsl(45, 85%, 60%)" className="animate-pulse-glow" style={{ animationDelay: '1s' }} />
              <circle cx="100" cy="90" r="7" fill="hsl(48, 88%, 56%)" className="animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
              <line x1="50" y1="50" x2="90" y2="30" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" className="animate-shimmer" />
              <line x1="50" y1="50" x2="40" y2="100" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" className="animate-shimmer" style={{ animationDelay: '0.5s' }} />
              <line x1="50" y1="50" x2="100" y2="90" stroke="hsl(45, 80%, 50%)" strokeWidth="2" opacity="0.6" className="animate-shimmer" style={{ animationDelay: '1s' }} />
              
              <circle cx="60" cy="180" r="9" fill="hsl(45, 88%, 58%)" className="animate-pulse-glow" style={{ animationDelay: '2s' }} />
              <circle cx="30" cy="220" r="11" fill="hsl(50, 85%, 55%)" className="animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
              <circle cx="85" cy="240" r="8" fill="hsl(48, 82%, 60%)" className="animate-pulse-glow" style={{ animationDelay: '3s' }} />
              
              <circle cx="45" cy="320" r="10" fill="hsl(45, 90%, 56%)" className="animate-bounce-slow" />
            </svg>
            
            {/* Right Bitcoin symbols with spin */}
            <svg className="absolute top-10 -right-8 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-spin-slow" style={{ transformOrigin: '200px 60px' }}>
                <circle cx="200" cy="60" r="40" stroke="hsl(38, 95%, 55%)" strokeWidth="4" fill="none" />
              </g>
              <text x="182" y="75" fill="hsl(38, 95%, 55%)" fontSize="40" fontWeight="bold" className="animate-pulse-glow">₿</text>
              
              <g className="animate-spin-slow" style={{ transformOrigin: '180px 180px', animationDirection: 'reverse' }}>
                <circle cx="180" cy="180" r="30" stroke="hsl(190, 80%, 50%)" strokeWidth="3" fill="none" />
              </g>
              <text x="167" y="192" fill="hsl(190, 80%, 50%)" fontSize="28" fontWeight="bold" className="animate-pulse-glow" style={{ animationDelay: '1s' }}>Ξ</text>
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-yellow-500/30 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-500/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-yellow-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'gaming':
        return (
          <>
            {/* Left pixel art with bounce */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-bounce-slow">
                <rect x="20" y="20" width="20" height="20" fill="hsl(280, 85%, 60%)" />
                <rect x="42" y="20" width="20" height="20" fill="hsl(320, 80%, 55%)" />
                <rect x="64" y="20" width="20" height="20" fill="hsl(195, 85%, 55%)" />
                <rect x="20" y="42" width="20" height="20" fill="hsl(260, 75%, 65%)" />
                <rect x="42" y="42" width="20" height="20" fill="hsl(145, 70%, 55%)" />
                <rect x="64" y="42" width="20" height="20" fill="hsl(45, 90%, 60%)" />
              </g>
              
              <g className="animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <rect x="30" y="100" width="16" height="16" fill="hsl(320, 80%, 55%)" />
                <rect x="48" y="100" width="16" height="16" fill="hsl(280, 85%, 60%)" />
                <rect x="30" y="118" width="16" height="16" fill="hsl(195, 85%, 55%)" />
                <rect x="48" y="118" width="16" height="16" fill="hsl(145, 70%, 55%)" />
              </g>
              
              <polygon points="60,180 70,160 80,180 75,180 75,200 65,200 65,180" fill="hsl(45, 90%, 60%)" className="animate-float-slow" />
              
              <g className="animate-pulse-glow">
                <polygon points="55,320 60,300 65,320 85,315 75,330 90,345 72,345 65,365 60,345 48,345 30,345 45,330 35,315" fill="hsl(45, 92%, 55%)" />
              </g>
            </svg>
            
            {/* Right controller elements */}
            <svg className="absolute top-20 -right-8 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="180" cy="50" r="22" stroke="hsl(280, 70%, 60%)" strokeWidth="4" fill="none" className="animate-pulse-glow" />
              <circle cx="220" cy="90" r="22" stroke="hsl(320, 75%, 55%)" strokeWidth="4" fill="none" className="animate-pulse-glow" style={{ animationDelay: '0.3s' }} />
              <circle cx="140" cy="90" r="22" stroke="hsl(180, 80%, 50%)" strokeWidth="4" fill="none" className="animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
              <circle cx="180" cy="130" r="22" stroke="hsl(140, 70%, 50%)" strokeWidth="4" fill="none" className="animate-pulse-glow" style={{ animationDelay: '0.9s' }} />
              
              <g className="animate-sway">
                <rect x="150" y="180" width="60" height="18" fill="hsl(270, 60%, 55%)" rx="4" />
                <rect x="172" y="162" width="18" height="54" fill="hsl(270, 60%, 55%)" rx="4" />
              </g>
            </svg>
            
            {/* Neon corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-pink-500/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 -right-20 w-48 h-96 rounded-full bg-cyan-500/15 blur-3xl animate-drift" />
          </>
        );

      case 'sports':
        return (
          <>
            {/* Left sports balls with bounce */}
            <svg className="absolute top-10 -left-6 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-bounce-slow">
                <circle cx="60" cy="60" r="40" stroke="hsl(145, 70%, 40%)" strokeWidth="4" fill="none" />
                <polygon points="60,28 78,48 72,72 48,72 42,48" stroke="hsl(145, 70%, 40%)" strokeWidth="3" fill="none" />
              </g>
              
              <g className="animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <circle cx="50" cy="180" r="35" stroke="hsl(25, 90%, 50%)" strokeWidth="4" fill="none" />
                <path d="M15 180 Q50 160, 85 180" stroke="hsl(25, 90%, 50%)" strokeWidth="3" fill="none" />
                <line x1="50" y1="145" x2="50" y2="215" stroke="hsl(25, 90%, 50%)" strokeWidth="3" />
              </g>
              
              <g className="animate-sway">
                <ellipse cx="55" cy="300" rx="45" ry="28" stroke="hsl(30, 60%, 35%)" strokeWidth="3" fill="none" />
                <path d="M20 300 Q55 280, 90 300 Q55 320, 20 300" stroke="hsl(30, 60%, 35%)" strokeWidth="2" fill="none" />
              </g>
            </svg>
            
            {/* Right sports elements */}
            <svg className="absolute top-20 -right-8 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <circle cx="180" cy="60" r="32" stroke="hsl(65, 80%, 50%)" strokeWidth="4" fill="none" />
                <path d="M160 38 Q180 60, 160 82" stroke="hsl(65, 80%, 50%)" strokeWidth="3" fill="none" />
                <path d="M200 38 Q180 60, 200 82" stroke="hsl(65, 80%, 50%)" strokeWidth="3" fill="none" />
              </g>
              
              <g className="animate-float-slow">
                <circle cx="200" cy="220" r="25" stroke="hsl(0, 0%, 95%)" strokeWidth="3" fill="none" />
                <path d="M180 210 Q200 225, 220 210" stroke="hsl(0, 70%, 45%)" strokeWidth="2" fill="none" />
              </g>
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-emerald-400/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-orange-400/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-green-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'music':
        return (
          <>
            {/* Left music notes floating */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-float-slow">
                <ellipse cx="50" cy="80" rx="25" ry="15" fill="hsl(280, 75%, 55%)" transform="rotate(-20 50 80)" />
                <line x1="72" y1="72" x2="72" y2="20" stroke="hsl(280, 75%, 55%)" strokeWidth="5" />
                <path d="M72 20 Q110 35, 95 65" stroke="hsl(280, 75%, 55%)" strokeWidth="5" fill="none" />
              </g>
              
              <g className="animate-float-delayed" style={{ animationDelay: '2s' }}>
                <ellipse cx="40" cy="180" rx="20" ry="12" fill="hsl(320, 70%, 50%)" transform="rotate(-20 40 180)" />
                <line x1="58" y1="174" x2="58" y2="130" stroke="hsl(320, 70%, 50%)" strokeWidth="4" />
              </g>
              
              <g className="animate-float-slow" style={{ animationDelay: '1s' }}>
                <ellipse cx="60" cy="280" rx="22" ry="14" fill="hsl(260, 70%, 55%)" transform="rotate(-15 60 280)" />
                <ellipse cx="95" cy="270" rx="22" ry="14" fill="hsl(260, 70%, 55%)" transform="rotate(-15 95 270)" />
                <line x1="80" y1="274" x2="80" y2="210" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
                <line x1="115" y1="264" x2="115" y2="200" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
                <line x1="80" y1="210" x2="115" y2="200" stroke="hsl(260, 70%, 55%)" strokeWidth="4" />
              </g>
              
              <g className="animate-float-delayed" style={{ animationDelay: '3s' }}>
                <ellipse cx="45" cy="370" rx="18" ry="11" fill="hsl(290, 65%, 52%)" transform="rotate(-20 45 370)" />
                <line x1="61" y1="364" x2="61" y2="325" stroke="hsl(290, 65%, 52%)" strokeWidth="3" />
              </g>
            </svg>
            
            {/* Right equalizer animated */}
            <svg className="absolute top-20 -right-6 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <rect x="140" y="40" width="14" height="60" fill="hsl(300, 70%, 55%)" rx="4" className="animate-bounce-slow" />
              <rect x="160" y="20" width="14" height="80" fill="hsl(280, 65%, 60%)" rx="4" className="animate-bounce-slow" style={{ animationDelay: '0.2s' }} />
              <rect x="180" y="50" width="14" height="50" fill="hsl(320, 75%, 50%)" rx="4" className="animate-bounce-slow" style={{ animationDelay: '0.4s' }} />
              <rect x="200" y="30" width="14" height="70" fill="hsl(290, 70%, 55%)" rx="4" className="animate-bounce-slow" style={{ animationDelay: '0.6s' }} />
              <rect x="220" y="45" width="14" height="55" fill="hsl(270, 68%, 58%)" rx="4" className="animate-bounce-slow" style={{ animationDelay: '0.8s' }} />
              
              <g className="animate-spin-slow" style={{ transformOrigin: '180px 170px' }}>
                <circle cx="180" cy="170" r="35" stroke="hsl(280, 70%, 55%)" strokeWidth="5" fill="none" />
              </g>
              <circle cx="180" cy="170" r="15" fill="hsl(280, 70%, 55%)" className="animate-pulse-glow" />
            </svg>
            
            {/* Bottom sound waves */}
            <svg className="absolute -bottom-2 left-0 w-full h-24 animate-wave" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 50 Q50 30, 100 50 T200 50 T300 50 T400 50 T500 50 T600 50 T700 50 T800 50" 
                    stroke="hsl(280, 70%, 55%)" strokeWidth="4" fill="none" />
              <path d="M0 70 Q60 50, 120 70 T240 70 T360 70 T480 70 T600 70 T720 70" 
                    stroke="hsl(320, 65%, 50%)" strokeWidth="2.5" fill="none" className="animate-wave" style={{ animationDelay: '0.5s' }} />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-pink-500/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/3 -right-20 w-48 h-80 rounded-full bg-violet-500/15 blur-3xl animate-drift" />
          </>
        );

      case 'coffee':
        return (
          <>
            {/* Left coffee cups with steam animation */}
            <svg className="absolute top-10 -left-4 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 60 L22 130 Q22 150 50 150 Q78 150 78 130 L70 60 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <ellipse cx="50" cy="60" rx="22" ry="10" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <path d="M78 75 Q100 75, 100 100 Q100 120, 78 120" stroke="hsl(25, 55%, 45%)" strokeWidth="4" fill="none" />
              {/* Animated steam */}
              <g className="animate-float-slow" style={{ opacity: 0.6 }}>
                <path d="M35 45 Q40 25, 50 30 Q55 25, 60 35" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" />
                <path d="M45 40 Q50 20, 55 25" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" />
              </g>
              
              <g className="animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <circle cx="40" cy="220" r="20" fill="hsl(25, 70%, 25%)" />
                <circle cx="65" cy="230" r="18" fill="hsl(25, 65%, 28%)" />
                <circle cx="55" cy="205" r="16" fill="hsl(25, 68%, 22%)" />
              </g>
              
              <g>
                <path d="M25 300 L20 350 Q20 365 45 365 Q70 365 70 350 L65 300 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="3" fill="none" />
                <ellipse cx="45" cy="300" rx="22" ry="8" stroke="hsl(25, 60%, 40%)" strokeWidth="3" fill="none" />
                <g className="animate-float-delayed" style={{ opacity: 0.5, animationDelay: '2s' }}>
                  <path d="M30 285 Q35 265, 45 270 Q50 262, 55 275" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" />
                </g>
              </g>
            </svg>
            
            {/* Right coffee elements */}
            <svg className="absolute top-20 -right-6 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <path d="M160 50 L152 120 Q152 140 185 140 Q218 140 218 120 L210 50 Z" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <ellipse cx="185" cy="50" rx="28" ry="12" stroke="hsl(25, 60%, 40%)" strokeWidth="4" fill="none" />
              <path d="M218 65 Q245 65, 245 95 Q245 120, 218 120" stroke="hsl(25, 55%, 45%)" strokeWidth="4" fill="none" />
              {/* Steam */}
              <g className="animate-float-slow" style={{ opacity: 0.5 }}>
                <path d="M175 35 Q185 15, 195 25" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" />
                <path d="M185 30 Q190 10, 195 20" stroke="hsl(25, 40%, 55%)" strokeWidth="2" fill="none" />
              </g>
              
              <g className="animate-sway">
                <circle cx="170" cy="200" r="22" fill="hsl(25, 70%, 25%)" />
                <circle cx="200" cy="195" r="20" fill="hsl(25, 65%, 28%)" />
                <circle cx="185" cy="220" r="18" fill="hsl(25, 68%, 22%)" />
              </g>
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-amber-600/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-orange-800/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 -left-20 w-40 h-80 rounded-full bg-amber-500/15 blur-3xl animate-drift" />
          </>
        );

      case 'nature':
        return (
          <>
            {/* Left trees and plants swaying */}
            <svg className="absolute top-10 -left-6 w-80 h-[450px]" xmlns="http://www.w3.org/2000/svg">
              <rect x="55" y="180" width="15" height="50" fill="hsl(25, 50%, 30%)" />
              <g className="animate-sway" style={{ transformOrigin: '60px 180px' }}>
                <polygon points="60,40 20,120 45,120 15,180 50,180 60,180 95,180 130,180 95,120 120,120 80,40" fill="hsl(140, 50%, 35%)" />
              </g>
              
              <rect x="42" y="360" width="12" height="35" fill="hsl(25, 45%, 32%)" />
              <g className="animate-sway" style={{ transformOrigin: '50px 250px', animationDelay: '1s' }}>
                <polygon points="45,250 15,310 35,310 10,360 40,360 50,360 80,360 110,360 85,310 105,310 75,250" fill="hsl(145, 45%, 40%)" />
              </g>
              
              <g className="animate-sway" style={{ animationDelay: '0.5s' }}>
                <ellipse cx="100" cy="200" rx="8" ry="35" fill="hsl(130, 55%, 40%)" transform="rotate(-15 100 200)" />
                <ellipse cx="115" cy="210" rx="7" ry="30" fill="hsl(135, 50%, 45%)" transform="rotate(10 115 210)" />
                <ellipse cx="90" cy="215" rx="6" ry="28" fill="hsl(140, 52%, 38%)" transform="rotate(-25 90 215)" />
              </g>
            </svg>
            
            {/* Right nature elements with sun */}
            <svg className="absolute top-20 -right-8 w-72 h-80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="60" r="40" fill="hsl(45, 95%, 60%)" className="animate-pulse-glow" />
              <g stroke="hsl(45, 95%, 55%)" strokeWidth="4" fill="none" className="animate-spin-slow" style={{ transformOrigin: '200px 60px' }}>
                <line x1="200" y1="10" x2="200" y2="25" />
                <line x1="200" y1="95" x2="200" y2="110" />
                <line x1="150" y1="60" x2="165" y2="60" />
                <line x1="235" y1="60" x2="250" y2="60" />
                <line x1="165" y1="25" x2="175" y2="35" />
                <line x1="225" y1="85" x2="235" y2="95" />
                <line x1="165" y1="95" x2="175" y2="85" />
                <line x1="225" y1="35" x2="235" y2="25" />
              </g>
              
              <g className="animate-sway">
                <path d="M160 200 Q180 150, 200 200 Q220 150, 240 200" stroke="hsl(140, 45%, 45%)" strokeWidth="3" fill="none" />
                <path d="M170 250 Q185 210, 200 250 Q215 210, 230 250" stroke="hsl(145, 50%, 40%)" strokeWidth="2" fill="none" />
              </g>
              
              <g className="animate-bounce-slow">
                <circle cx="180" cy="300" r="15" fill="hsl(0, 70%, 55%)" />
                <circle cx="210" cy="310" r="12" fill="hsl(40, 85%, 55%)" />
                <circle cx="195" cy="330" r="14" fill="hsl(280, 60%, 55%)" />
              </g>
            </svg>
            
            {/* Bottom grass and flowers */}
            <svg className="absolute -bottom-4 left-0 w-full h-32 animate-sway" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 100 Q20 70, 30 100 Q40 60, 50 100 Q65 70, 75 100 Q85 55, 100 100 Q115 65, 130 100 Q140 70, 155 100 Q165 60, 180 100 Q195 70, 210 100 Q220 55, 235 100" 
                    stroke="hsl(140, 50%, 40%)" strokeWidth="3" fill="none" />
              
              <circle cx="15%" cy="85" r="8" fill="hsl(350, 70%, 60%)" className="animate-bounce-slow" />
              <circle cx="15%" cy="85" r="3" fill="hsl(45, 90%, 70%)" />
              
              <circle cx="35%" cy="75" r="10" fill="hsl(280, 60%, 60%)" className="animate-bounce-slow" style={{ animationDelay: '0.5s' }} />
              <circle cx="35%" cy="75" r="4" fill="hsl(50, 85%, 68%)" />
              
              <circle cx="55%" cy="88" r="7" fill="hsl(45, 85%, 60%)" className="animate-bounce-slow" style={{ animationDelay: '1s' }} />
              <circle cx="55%" cy="88" r="3" fill="hsl(25, 80%, 50%)" />
              
              <circle cx="75%" cy="78" r="9" fill="hsl(200, 70%, 60%)" className="animate-bounce-slow" style={{ animationDelay: '1.5s' }} />
              <circle cx="75%" cy="78" r="3" fill="hsl(45, 90%, 70%)" />
            </svg>
            
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-yellow-400/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-green-500/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/3 -left-20 w-48 h-80 rounded-full bg-emerald-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'space':
        return (
          <>
            {/* Starfield on left */}
            <svg className="absolute top-0 -left-4 w-80 h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="50" r="2" fill="hsl(0, 0%, 95%)" className="animate-shimmer" />
              <circle cx="80" cy="120" r="1.5" fill="hsl(200, 80%, 85%)" className="animate-shimmer" style={{ animationDelay: '0.5s' }} />
              <circle cx="45" cy="200" r="3" fill="hsl(260, 70%, 90%)" className="animate-pulse-glow" />
              <circle cx="100" cy="280" r="2" fill="hsl(0, 0%, 95%)" className="animate-shimmer" style={{ animationDelay: '1s' }} />
              <circle cx="60" cy="350" r="1.5" fill="hsl(180, 80%, 85%)" className="animate-shimmer" style={{ animationDelay: '1.5s' }} />
              <circle cx="25" cy="420" r="2.5" fill="hsl(45, 90%, 90%)" className="animate-pulse-glow" style={{ animationDelay: '2s' }} />
              <circle cx="90" cy="500" r="2" fill="hsl(0, 0%, 95%)" className="animate-shimmer" style={{ animationDelay: '0.8s' }} />
              
              {/* Planet */}
              <g className="animate-float-slow">
                <circle cx="70" cy="150" r="25" fill="hsl(260, 60%, 45%)" />
                <ellipse cx="70" cy="150" rx="40" ry="8" stroke="hsl(45, 60%, 60%)" strokeWidth="3" fill="none" transform="rotate(-20 70 150)" />
              </g>
              
              {/* Shooting star */}
              <g className="animate-drift">
                <line x1="20" y1="300" x2="80" y2="320" stroke="hsl(0, 0%, 95%)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="20" cy="300" r="3" fill="hsl(0, 0%, 100%)" />
              </g>
            </svg>
            
            {/* Right side nebula and stars */}
            <svg className="absolute top-20 -right-8 w-72 h-[500px]" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="40" r="2" fill="hsl(0, 0%, 95%)" className="animate-shimmer" />
              <circle cx="180" cy="100" r="1.5" fill="hsl(280, 70%, 85%)" className="animate-shimmer" style={{ animationDelay: '0.3s' }} />
              <circle cx="220" cy="180" r="2.5" fill="hsl(200, 80%, 90%)" className="animate-pulse-glow" style={{ animationDelay: '1s' }} />
              <circle cx="190" cy="260" r="2" fill="hsl(0, 0%, 95%)" className="animate-shimmer" style={{ animationDelay: '0.7s' }} />
              <circle cx="210" cy="340" r="3" fill="hsl(45, 90%, 85%)" className="animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
              
              {/* Moon */}
              <g className="animate-float-delayed">
                <circle cx="200" cy="420" r="30" fill="hsl(40, 10%, 70%)" />
                <circle cx="190" cy="410" r="6" fill="hsl(40, 8%, 60%)" />
                <circle cx="210" cy="430" r="4" fill="hsl(40, 8%, 62%)" />
                <circle cx="195" cy="435" r="3" fill="hsl(40, 8%, 58%)" />
              </g>
            </svg>
            
            {/* Galaxy glow */}
            <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 -right-20 w-60 h-60 rounded-full bg-cyan-400/15 blur-3xl animate-drift" />
          </>
        );

      case 'photography':
        return (
          <>
            {/* Left camera elements */}
            <svg className="absolute top-20 -left-4 w-72 h-[400px]" xmlns="http://www.w3.org/2000/svg">
              {/* Camera body */}
              <g className="animate-float-slow">
                <rect x="20" y="40" width="80" height="55" rx="6" stroke="hsl(0, 0%, 40%)" strokeWidth="3" fill="none" />
                <circle cx="60" cy="67" r="20" stroke="hsl(0, 0%, 35%)" strokeWidth="3" fill="none" />
                <circle cx="60" cy="67" r="12" stroke="hsl(0, 0%, 45%)" strokeWidth="2" fill="none" />
                <circle cx="60" cy="67" r="5" fill="hsl(200, 70%, 50%)" className="animate-pulse-glow" />
                <rect x="30" y="30" width="20" height="10" rx="2" fill="hsl(0, 0%, 40%)" />
                <circle cx="90" cy="50" r="4" fill="hsl(0, 0%, 50%)" />
              </g>
              
              {/* Film strip */}
              <g className="animate-sway">
                <rect x="30" y="150" width="60" height="80" fill="hsl(0, 0%, 15%)" rx="2" />
                <rect x="35" y="155" width="20" height="15" fill="hsl(35, 60%, 70%)" rx="1" />
                <rect x="60" y="155" width="20" height="15" fill="hsl(200, 50%, 65%)" rx="1" />
                <rect x="35" y="175" width="20" height="15" fill="hsl(140, 50%, 60%)" rx="1" />
                <rect x="60" y="175" width="20" height="15" fill="hsl(0, 60%, 65%)" rx="1" />
                <rect x="35" y="195" width="20" height="15" fill="hsl(280, 50%, 65%)" rx="1" />
                <rect x="60" y="195" width="20" height="15" fill="hsl(45, 70%, 70%)" rx="1" />
              </g>
              
              {/* Aperture icon */}
              <g className="animate-spin-slow" style={{ transformOrigin: '60px 300px' }}>
                <circle cx="60" cy="300" r="30" stroke="hsl(0, 0%, 40%)" strokeWidth="2" fill="none" />
                <path d="M60 275 L65 290 L60 285 L55 290 Z" fill="hsl(0, 0%, 50%)" />
                <path d="M85 300 L70 295 L75 300 L70 305 Z" fill="hsl(0, 0%, 50%)" />
                <path d="M60 325 L55 310 L60 315 L65 310 Z" fill="hsl(0, 0%, 50%)" />
                <path d="M35 300 L50 305 L45 300 L50 295 Z" fill="hsl(0, 0%, 50%)" />
              </g>
            </svg>
            
            {/* Right side photo frames */}
            <svg className="absolute top-10 -right-6 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              <g className="animate-float-delayed">
                <rect x="150" y="30" width="70" height="90" stroke="hsl(0, 0%, 35%)" strokeWidth="3" fill="hsl(0, 0%, 98%)" transform="rotate(5 185 75)" />
                <rect x="158" y="38" width="54" height="65" fill="hsl(200, 50%, 80%)" transform="rotate(5 185 75)" />
              </g>
              <g className="animate-float-slow" style={{ animationDelay: '1s' }}>
                <rect x="140" y="150" width="65" height="85" stroke="hsl(0, 0%, 35%)" strokeWidth="3" fill="hsl(0, 0%, 98%)" transform="rotate(-8 172 192)" />
                <rect x="147" y="157" width="51" height="62" fill="hsl(35, 60%, 75%)" transform="rotate(-8 172 192)" />
              </g>
            </svg>
            
            {/* Subtle glows */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-gray-400/15 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-amber-300/15 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          </>
        );

      case 'travel':
        return (
          <>
            {/* Left side travel elements */}
            <svg className="absolute top-10 -left-4 w-80 h-[450px]" xmlns="http://www.w3.org/2000/svg">
              {/* Airplane */}
              <g className="animate-drift">
                <path d="M80 60 L40 80 L45 85 L75 75 L70 100 L80 95 L90 100 L85 75 L115 85 L120 80 L80 60" fill="hsl(200, 80%, 55%)" />
                <line x1="55" y1="82" x2="30" y2="95" stroke="hsl(200, 70%, 70%)" strokeWidth="1" strokeDasharray="3,2" />
              </g>
              
              {/* Hot air balloon */}
              <g className="animate-float-slow">
                <ellipse cx="60" cy="180" rx="35" ry="45" fill="hsl(0, 70%, 60%)" />
                <path d="M25 180 Q60 230, 95 180" fill="hsl(45, 80%, 60%)" />
                <ellipse cx="60" cy="180" rx="35" ry="45" stroke="hsl(0, 60%, 50%)" strokeWidth="2" fill="none" />
                <line x1="35" y1="220" x2="40" y2="245" stroke="hsl(30, 40%, 40%)" strokeWidth="2" />
                <line x1="85" y1="220" x2="80" y2="245" stroke="hsl(30, 40%, 40%)" strokeWidth="2" />
                <rect x="38" y="245" width="44" height="20" stroke="hsl(30, 50%, 45%)" strokeWidth="2" fill="none" rx="3" />
              </g>
              
              {/* Compass */}
              <g className="animate-spin-slow" style={{ transformOrigin: '55px 360px' }}>
                <circle cx="55" cy="360" r="30" stroke="hsl(35, 60%, 50%)" strokeWidth="3" fill="none" />
                <polygon points="55,335 50,360 55,355 60,360" fill="hsl(0, 70%, 55%)" />
                <polygon points="55,385 60,360 55,365 50,360" fill="hsl(0, 0%, 90%)" />
              </g>
            </svg>
            
            {/* Right side - map and luggage */}
            <svg className="absolute top-20 -right-6 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              {/* Suitcase */}
              <g className="animate-bounce-slow">
                <rect x="160" y="40" width="50" height="70" rx="5" fill="hsl(200, 70%, 50%)" stroke="hsl(200, 60%, 40%)" strokeWidth="2" />
                <rect x="175" y="30" width="20" height="12" rx="3" stroke="hsl(200, 60%, 40%)" strokeWidth="2" fill="none" />
                <line x1="160" y1="65" x2="210" y2="65" stroke="hsl(200, 60%, 40%)" strokeWidth="2" />
                <line x1="160" y1="85" x2="210" y2="85" stroke="hsl(200, 60%, 40%)" strokeWidth="2" />
              </g>
              
              {/* Location pin */}
              <g className="animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <path d="M185 170 Q185 140, 210 140 Q235 140, 235 170 Q235 200, 210 230 Q185 200, 185 170" fill="hsl(0, 70%, 55%)" />
                <circle cx="210" cy="165" r="12" fill="hsl(0, 0%, 100%)" />
              </g>
            </svg>
            
            {/* Glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-sky-400/25 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 -left-20 w-48 h-80 rounded-full bg-cyan-300/15 blur-3xl animate-drift" />
          </>
        );

      case 'cinema':
        return (
          <>
            {/* Left film elements */}
            <svg className="absolute top-10 -left-4 w-80 h-[450px]" xmlns="http://www.w3.org/2000/svg">
              {/* Film reel */}
              <g className="animate-spin-slow" style={{ transformOrigin: '70px 80px' }}>
                <circle cx="70" cy="80" r="45" stroke="hsl(0, 0%, 30%)" strokeWidth="4" fill="none" />
                <circle cx="70" cy="80" r="15" fill="hsl(0, 0%, 25%)" />
                <circle cx="70" cy="40" r="8" fill="hsl(0, 0%, 20%)" />
                <circle cx="110" cy="80" r="8" fill="hsl(0, 0%, 20%)" />
                <circle cx="70" cy="120" r="8" fill="hsl(0, 0%, 20%)" />
                <circle cx="30" cy="80" r="8" fill="hsl(0, 0%, 20%)" />
              </g>
              
              {/* Film strip */}
              <g className="animate-sway">
                <rect x="30" y="180" width="80" height="120" fill="hsl(0, 0%, 10%)" rx="2" />
                {[0, 1, 2].map((i) => (
                  <g key={i}>
                    <rect x="35" y={185 + i * 38} width="70" height="32" fill="hsl(45, 20%, 15%)" rx="1" />
                    <rect x="30" y={188 + i * 38} width="4" height="6" fill="hsl(0, 0%, 15%)" />
                    <rect x="30" y={200 + i * 38} width="4" height="6" fill="hsl(0, 0%, 15%)" />
                    <rect x="106" y={188 + i * 38} width="4" height="6" fill="hsl(0, 0%, 15%)" />
                    <rect x="106" y={200 + i * 38} width="4" height="6" fill="hsl(0, 0%, 15%)" />
                  </g>
                ))}
              </g>
              
              {/* Clapperboard */}
              <g className="animate-float-slow">
                <rect x="25" y="340" width="90" height="60" fill="hsl(0, 0%, 15%)" rx="3" />
                <rect x="25" y="340" width="90" height="20" fill="hsl(0, 0%, 10%)" rx="3" />
                <line x1="35" y1="340" x2="45" y2="360" stroke="hsl(0, 0%, 95%)" strokeWidth="3" />
                <line x1="55" y1="340" x2="65" y2="360" stroke="hsl(0, 0%, 95%)" strokeWidth="3" />
                <line x1="75" y1="340" x2="85" y2="360" stroke="hsl(0, 0%, 95%)" strokeWidth="3" />
                <line x1="95" y1="340" x2="105" y2="360" stroke="hsl(0, 0%, 95%)" strokeWidth="3" />
              </g>
            </svg>
            
            {/* Right side - popcorn and star */}
            <svg className="absolute top-20 -right-6 w-64 h-80" xmlns="http://www.w3.org/2000/svg">
              {/* Popcorn */}
              <g className="animate-bounce-slow">
                <path d="M160 120 L150 200 L220 200 L210 120 Z" fill="hsl(0, 75%, 50%)" stroke="hsl(0, 65%, 40%)" strokeWidth="2" />
                <ellipse cx="170" cy="105" r="12" fill="hsl(45, 90%, 85%)" />
                <ellipse cx="190" cy="100" r="14" fill="hsl(45, 90%, 80%)" />
                <ellipse cx="205" cy="108" r="11" fill="hsl(45, 90%, 85%)" />
                <ellipse cx="180" cy="115" r="13" fill="hsl(45, 90%, 82%)" />
                <ellipse cx="195" cy="112" r="10" fill="hsl(45, 90%, 88%)" />
              </g>
              
              {/* Hollywood star */}
              <g className="animate-pulse-glow">
                <polygon points="185,250 190,270 210,270 194,282 200,302 185,290 170,302 176,282 160,270 180,270" 
                         fill="hsl(45, 80%, 55%)" stroke="hsl(45, 70%, 45%)" strokeWidth="2" />
              </g>
            </svg>
            
            {/* Dramatic glows */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-red-600/20 blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 -right-20 w-48 h-80 rounded-full bg-red-400/10 blur-3xl animate-drift" />
          </>
        );

      default:
        return null;
    }
  };

  const themedStyles = ['spring', 'summer', 'autumn', 'winter', 'crypto', 'gaming', 'sports', 'music', 'coffee', 'nature', 'space', 'photography', 'travel', 'cinema'];
  
  if (!themedStyles.includes(style)) {
    return null;
  }

  // Get animation speed multiplier
  const { animationSpeed, animationIntensity } = useTheme();
  
  const getAnimationStyle = () => {
    if (animationSpeed === 'off') return { display: 'none' };
    
    const speedMultiplier = animationSpeed === 'slow' ? 2 : animationSpeed === 'fast' ? 0.5 : 1;
    const opacityMultiplier = animationIntensity === 'subtle' ? 0.5 : animationIntensity === 'vibrant' ? 1.3 : 1;
    
    return {
      '--animation-speed': speedMultiplier,
      opacity: Math.min(1, opacityMultiplier),
    } as React.CSSProperties;
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={getAnimationStyle()}>
      {renderPattern()}
    </div>
  );
};
