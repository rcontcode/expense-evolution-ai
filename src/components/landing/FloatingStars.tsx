import { useMemo } from 'react';

interface Star {
  id: number;
  size: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  opacity: number;
}

export const FloatingStars = () => {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-[twinkle_3s_ease-in-out_infinite]"
          style={{
            width: star.size,
            height: star.size,
            left: star.left,
            top: star.top,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
            boxShadow: `0 0 ${star.size * 2}px ${star.size / 2}px rgba(255, 255, 255, 0.3)`,
          }}
        />
      ))}
      
      {/* Larger accent stars with color */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`accent-${i}`}
          className="absolute animate-[float_6s_ease-in-out_infinite]"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              i % 3 === 0 
                ? 'bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.4)]' 
                : i % 3 === 1 
                  ? 'bg-orange-400 shadow-[0_0_10px_3px_rgba(251,146,60,0.4)]'
                  : 'bg-purple-400 shadow-[0_0_10px_3px_rgba(168,85,247,0.4)]'
            } animate-[twinkle_2s_ease-in-out_infinite]`}
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        </div>
      ))}

      {/* Shooting stars */}
      <div className="absolute top-1/4 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-[shootingStar_8s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 animate-[shootingStar_8s_ease-in-out_infinite]" style={{ animationDelay: '5s' }} />
      <div className="absolute top-3/4 left-0 w-20 h-[1px] bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-0 animate-[shootingStar_8s_ease-in-out_infinite]" style={{ animationDelay: '8s' }} />
    </div>
  );
};