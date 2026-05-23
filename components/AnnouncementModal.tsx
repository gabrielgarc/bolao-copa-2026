import React from 'react';
import { Announcement } from '../models/announcement.model';

interface AnnouncementModalProps {
  announcement: Announcement;
  onConfirm: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onConfirm }) => {
  const dateStr = new Date(announcement.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
      {/* Brilho de fundo pulsante */}
      <div className="absolute inset-0 animate-pulse bg-yellow-500/5 pointer-events-none" />

      <div className="relative w-full max-w-md animate-scaleIn">
        {/* Sombra retrô */}
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-yellow-500 border-4 border-black" />

        <div className="relative bg-gray-900 border-4 border-black text-white">
          {/* Header */}
          <div className="bg-yellow-400 border-b-4 border-black px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <div>
              <div
                className="text-[9px] uppercase font-bold text-black/60 tracking-widest"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                Aviso do Bolão
              </div>
              <div className="text-[8px] text-black/50 font-bold">{dateStr}</div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <h3
              className="text-lg md:text-xl font-black uppercase text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] mb-4 leading-tight"
            >
              {announcement.title}
            </h3>

            <div className="bg-black/30 border-2 border-gray-700 p-4 mb-6">
              <p className="text-sm md:text-base text-gray-200 leading-relaxed whitespace-pre-wrap">
                {announcement.description}
              </p>
            </div>

            <button
              id="announcement-ok-btn"
              onClick={onConfirm}
              className="
                w-full py-3 px-6 uppercase font-black text-sm md:text-base
                bg-yellow-400 text-black border-4 border-black
                shadow-[4px_4px_0_rgba(0,0,0,1)]
                active:shadow-none active:translate-x-1 active:translate-y-1
                transition-all hover:bg-yellow-300
              "
            >
              Ok, entendi! ✓
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; }
      `}</style>
    </div>
  );
};
