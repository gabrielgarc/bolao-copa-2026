import React, { useEffect, useRef } from 'react';
import { PixelCard } from './PixelComponents';

// ---------- Fogos de artifício (Canvas) ----------
const FW_COLORS = [
  '#facc15', '#f87171', '#60a5fa', '#34d399',
  '#f472b6', '#a78bfa', '#fb923c', '#ffffff',
];

interface FWParticle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; color: string;
  size: number;
}

const FireworksCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: FWParticle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const burst = () => {
      const cx = 20 + Math.random() * (canvas.width - 40);
      const cy = 10 + Math.random() * canvas.height * 0.55;
      const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
      const count = 28 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2.5 + Math.random() * 4;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    burst();
    const burstInterval = setInterval(burst, 900);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.vx *= 0.97;
        p.alpha -= 0.013;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      clearInterval(burstInterval);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
// -------------------------------------------------

interface WinnerRecord {
  year: number;
  location: string;
  themeClass: string;
  firstPlace: string;
  secondPlace: string;
}

const winnersData: WinnerRecord[] = [
  {
    year: 2026,
    location: "EUA / CAN / MEX",
    themeClass: "bg-gradient-to-br from-blue-950 to-red-950 border-red-400 text-red-100",
    firstPlace: "Urbano Garcia",
    secondPlace: "Tomás Garcia"
  },
  {
    year: 2022,
    location: "Catar",
    themeClass: "bg-gradient-to-br from-red-950 to-amber-950 border-amber-500 text-amber-200",
    firstPlace: "Malu",
    secondPlace: "Dai e Rafa"
  },
  {
    year: 2018,
    location: "Rússia",
    themeClass: "bg-gradient-to-br from-blue-950 to-indigo-950 border-blue-400 text-blue-200",
    firstPlace: "Messi",
    secondPlace: "Miguel garcia"
  },
  {
    year: 2014,
    location: "Brasil",
    themeClass: "bg-gradient-to-br from-emerald-950 to-green-950 border-green-400 text-green-200",
    firstPlace: "André Oberg",
    secondPlace: "Tomás Garcia"
  },
  {
    year: 2010,
    location: "África do Sul",
    themeClass: "bg-gradient-to-br from-yellow-950 to-orange-950 border-yellow-400 text-yellow-200",
    firstPlace: "João Garcia",
    secondPlace: "-"
  }
];

export const HallOfFameScreen: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-10">
      <PixelCard className="bg-gray-900 border-black text-white">
        {/* Banner retrô */}
        <div className="text-center mb-10 border-b-4 border-black pb-6 bg-black/40 p-4 relative overflow-hidden">
          {/* Luzes piscantes decorativas */}
          <div className="absolute top-2 left-0 right-0 flex justify-between px-4">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '600ms' }}></div>
          </div>

          <h2
            className="text-lg sm:text-2xl md:text-3xl text-yellow-400 font-bold uppercase drop-shadow-[4px_4px_0_rgba(239,68,68,1)] tracking-widest leading-normal mb-2"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            HALL DA FAMA
          </h2>
          <p
            className="text-white text-[8px] md:text-xs uppercase font-bold tracking-[0.2em] opacity-80"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            Galeria de Campeões do Nosso Bolão
          </p>
        </div>

        {/* Grid de Edições */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {winnersData.map((record) => (
            <div
              key={record.year}
              className={`
                border-4 border-black p-5 relative overflow-hidden
                shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-all duration-300
                hover:-translate-y-1 hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]
                ${record.themeClass}
              `}
            >
              {/* Fogos de artifício exclusivos do card 2026 */}
              {record.year === 2026 && <FireworksCanvas />}

              {/* Marca D'Água do Ano */}
              <div className="absolute right-2 -bottom-4 text-7xl font-black opacity-10 select-none pointer-events-none font-mono">
                {record.year}
              </div>

              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-center mb-4 border-b-2 border-dashed border-white/20 pb-2 relative z-10">
                <span className="font-bold text-lg md:text-xl font-mono tracking-wider">
                  Copa de {record.year}
                </span>
                <span className="text-[8px] md:text-[9px] uppercase bg-black/40 px-2 py-0.5 border border-white/10 font-bold">
                  📍 {record.location}
                </span>
              </div>

              {/* Pódio de Vencedores */}
              <div className="space-y-4 relative z-10" style={{ position: 'relative', zIndex: 10 }}>
                {/* 1º Lugar */}
                <div className="flex items-center gap-3 bg-black/30 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
                  <img
                    src="/trophy-world-cup.svg"
                    alt="Taça da Copa"
                    className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0"
                  />
                  <div className="flex-grow">
                    <div
                      className="text-[7px] md:text-[8px] uppercase font-bold opacity-60 tracking-wider mb-0.5"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      1st Place / Campeão
                    </div>
                    <div className="text-sm md:text-lg font-black uppercase tracking-tight text-yellow-300">
                      {record.firstPlace}
                    </div>
                  </div>
                </div>

                {/* 2º Lugar */}
                <div className="flex items-center gap-3 bg-black/20 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
                  <div className="text-2xl md:text-3xl shrink-0">🥈</div>
                  <div className="flex-grow">
                    <div
                      className="text-[7px] md:text-[8px] uppercase font-bold opacity-60 tracking-wider mb-0.5"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      2nd Place / Vice
                    </div>
                    <div className="text-sm md:text-lg font-bold uppercase tracking-tight text-gray-300">
                      {record.secondPlace}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer/Mensagem de incentivo */}
        <div className="mt-10 pt-6 border-t-4 border-black text-center bg-black/20 p-4">
          <p
            className="text-yellow-400 text-[8px] md:text-[10px] uppercase font-bold leading-relaxed mb-1"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            ★ Quem será o próximo nome a entrar na história? ★
          </p>
          <p className="text-[10px] text-white/50 uppercase font-mono">
            Será que você estará no pódio na próxima edição?
          </p>
        </div>
      </PixelCard>
    </div>
  );
};
