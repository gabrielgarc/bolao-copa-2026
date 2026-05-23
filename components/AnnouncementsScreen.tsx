import React, { useEffect, useState } from 'react';
import { PixelCard } from './PixelComponents';
import { Announcement } from '../models/announcement.model';
import { AnnouncementService } from '../services/announcementService';
import { UserService } from '../services/userService';

export const AnnouncementsScreen: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await UserService.getCurrentPlayer();
        if (!user) return;
        const data = await AnnouncementService.getAll(user.id);
        setAnnouncements(data);
      } catch (err) {
        console.error('Erro ao carregar avisos', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn pb-10">
      <PixelCard className="bg-gray-900 border-black text-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-4 border-black pb-4 bg-black/40 p-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-2xl">📢</span>
            <h2
              className="text-lg sm:text-xl text-yellow-400 font-bold uppercase drop-shadow-[2px_2px_0_rgba(239,68,68,1)] tracking-widest"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Avisos
            </h2>
          </div>
          <p className="text-[9px] text-white/60 uppercase font-bold tracking-widest">
            Comunicados oficiais do bolão
          </p>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 bg-yellow-400 animate-bounce shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-bold uppercase text-sm">Nenhum aviso publicado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a, idx) => {
              const dateStr = new Date(a.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              return (
                <div
                  key={a.id}
                  className={`border-4 border-black p-4 relative transition-all duration-200 ${
                    idx === 0
                      ? 'bg-gradient-to-br from-yellow-950 to-gray-900 border-yellow-500'
                      : 'bg-gray-800'
                  }`}
                >
                  {/* Badge mais recente */}
                  {idx === 0 && (
                    <span className="absolute -top-3 left-3 bg-yellow-400 text-black text-[8px] font-black uppercase px-2 py-0.5 border-2 border-black">
                      Mais Recente
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <h3 className="font-black uppercase text-yellow-300 text-sm md:text-base leading-tight">
                      {a.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.isRead ? (
                        <span className="text-[9px] bg-green-900 text-green-300 border border-green-600 px-2 py-0.5 font-bold uppercase">
                          ✓ Lido
                        </span>
                      ) : (
                        <span className="text-[9px] bg-red-900 text-red-300 border border-red-600 px-2 py-0.5 font-bold uppercase animate-pulse">
                          Novo
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                    {a.description}
                  </p>

                  <div className="text-[9px] text-gray-500 font-mono">
                    📅 {dateStr}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PixelCard>
    </div>
  );
};
