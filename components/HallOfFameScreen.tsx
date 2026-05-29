import React from 'react';
import { PixelCard } from './PixelComponents';

interface WinnerRecord {
  year: number;
  location: string;
  themeClass: string;
  firstPlace: string;
  secondPlace: string;
}

const winnersData: WinnerRecord[] = [
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
              {/* Marca D'Água do Ano */}
              <div className="absolute right-2 -bottom-4 text-7xl font-black opacity-10 select-none pointer-events-none font-mono">
                {record.year}
              </div>

              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-center mb-4 border-b-2 border-dashed border-white/20 pb-2">
                <span className="font-bold text-lg md:text-xl font-mono tracking-wider">
                  Copa de {record.year}
                </span>
                <span className="text-[8px] md:text-[9px] uppercase bg-black/40 px-2 py-0.5 border border-white/10 font-bold">
                  📍 {record.location}
                </span>
              </div>

              {/* Pódio de Vencedores */}
              <div className="space-y-4 relative z-10">
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
            Faça seus palpites para a Copa de 2026 e conquiste sua vaga no pódio!
          </p>
        </div>
      </PixelCard>
    </div>
  );
};
