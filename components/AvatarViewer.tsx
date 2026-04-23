import React from 'react';

export interface AvatarConfig {
  head: number;
  hair: number;
  skinColor: string;
  hairColor: string;
  eyeColor: string;
  bgColor: string;
}

interface AvatarViewerProps {
  configStr: string;
  className?: string;
  size?: number;
}

export const AvatarViewer: React.FC<AvatarViewerProps> = ({ configStr, className = '', size = 50 }) => {
  let config: AvatarConfig | null = null;
  try {
    if (configStr && configStr.startsWith('{')) {
      config = JSON.parse(configStr);
    }
  } catch (e) {
    config = null;
  }

  // Fallback se não for JSON válido (ex: "user-ronaldo")
  if (!config) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`pixelated ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <rect x="0" y="0" width="24" height="24" fill="#cbd5e1" />
        <rect x="7" y="8" width="10" height="10" fill="#f1c27d" />
        <rect x="7" y="7" width="10" height="2" fill="#4a3000" />
        <rect x="6" y="8" width="2" height="4" fill="#4a3000" />
        <rect x="16" y="8" width="2" height="4" fill="#4a3000" />
        <rect x="9" y="11" width="2" height="2" fill="#000" />
        <rect x="13" y="11" width="2" height="2" fill="#000" />
        <rect x="10" y="15" width="4" height="1" fill="#000" />
      </svg>
    );
  }

  const { head, hair, skinColor, hairColor, eyeColor, bgColor } = config;

  // Cores de Sombreado padrão (Multiply effect simulation)
  const shadow = "rgba(0,0,0,0.15)";
  const deepShadow = "rgba(0,0,0,0.25)";
  const shirtColor = "#7fc241"; // Verde Brasil base

  // A face ocupará x=6 a x=18 (12px largura). O centro vertical do sombreamento é x=12.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`pixelated ${className}`} style={{ shapeRendering: 'crispEdges', background: bgColor }}>
      
      <g id="body">
        {/* Camisa */}
        <rect x="4" y="18" width="16" height="6" fill={shirtColor} />
        {/* Sombra da camisa (metade direita) */}
        <rect x="12" y="18" width="8" height="6" fill={shadow} />
        {/* Braços (Pele) */}
        <rect x="0" y="18" width="4" height="6" fill={skinColor} />
        <rect x="20" y="18" width="4" height="6" fill={skinColor} />
        <rect x="20" y="18" width="4" height="6" fill={shadow} />
      </g>
      
      <g id="neck">
        <rect x="9" y="15" width="6" height="3" fill={skinColor} />
        {/* Sombra abaixo do queixo */}
        <rect x="9" y="15" width="6" height="1" fill={deepShadow} />
        {/* Sombra direita do pescoço */}
        <rect x="12" y="16" width="3" height="2" fill={shadow} />
      </g>

      <g id="ears">
        {/* Orelha Esquerda */}
        <rect x="4" y="9" width="2" height="3" fill={skinColor} />
        {/* Orelha Direita */}
        <rect x="18" y="9" width="2" height="3" fill={skinColor} />
        <rect x="18" y="9" width="2" height="3" fill={shadow} />
        {/* Brinco opcional em alguma orelha? (exclusivo p/ dar um charme no random) */}
        {head === 3 && <rect x="4" y="11" width="1" height="1" fill="#fbbf24" />}
      </g>

      <g id="head">
        {head === 0 && ( /* Padrão (Retangular alta) */
          <>
            <rect x="6" y="4" width="12" height="12" fill={skinColor} />
            <rect x="12" y="4" width="6" height="12" fill={shadow} />
          </>
        )}
        {head === 1 && ( /* Redonda / Baixa */
          <>
            <rect x="6" y="6" width="12" height="10" fill={skinColor} />
            <rect x="12" y="6" width="6" height="10" fill={shadow} />
          </>
        )}
        {head === 2 && ( /* Longa Queixuda */
          <>
            <rect x="6" y="3" width="12" height="14" fill={skinColor} />
            <rect x="12" y="3" width="6" height="14" fill={shadow} />
          </>
        )}
        {head === 3 && ( /* Larga e Gordinha */
          <>
            <rect x="5" y="5" width="14" height="11" fill={skinColor} />
            <rect x="12" y="5" width="7" height="11" fill={shadow} />
          </>
        )}
        {head === 4 && ( /* Triangular */
          <>
            <rect x="6" y="4" width="12" height="8" fill={skinColor} />
            <rect x="12" y="4" width="6" height="8" fill={shadow} />
            <rect x="7" y="12" width="10" height="2" fill={skinColor} />
            <rect x="12" y="12" width="5" height="2" fill={shadow} />
            <rect x="9" y="14" width="6" height="2" fill={skinColor} />
            <rect x="12" y="14" width="3" height="2" fill={shadow} />
          </>
        )}
      </g>

      <g id="face">
        {/* Sobrancelhas / Olhos Retos (estilo minimalista) */}
        <rect x="8" y="8" width="3" height="1" fill="#000" />
        <rect x="13" y="8" width="3" height="1" fill="#000" />
        {/* Pupila com cor */}
        <rect x="8" y="9" width="3" height="1" fill={eyeColor} />
        <rect x="13" y="9" width="3" height="1" fill={eyeColor} />
        <rect x="13" y="9" width="3" height="1" fill={shadow} /> {/* Sombra na pupila direita */}

        {/* Boca & Bigode estilo referência */}
        <rect x="9" y="12" width="6" height="3" fill="#333" /> {/* Area escura/bigode */}
        <rect x="10" y="13" width="4" height="1" fill="#fff" /> {/* Dentes */}
        <rect x="12" y="13" width="2" height="1" fill={shadow} /> {/* Sombra dente */}
      </g>

      <g id="hair">
        {/* Cabelos (5 tipos) */}
        {/* Aplicando a mesma lógica de cor base seguida por overlay de sombra horizontal */}
        {hair === 0 && ( /* Careca */
          <></> 
        )}
        {hair === 1 && ( /* Cabelo curto padrao "Militar" (como a ref) */
          <>
            <rect x="6" y="2" width="12" height="4" fill={hairColor} />
            <rect x="6" y="6" width="2" height="3" fill={hairColor} />
            <rect x="16" y="6" width="2" height="3" fill={hairColor} />
            
            {/* Sombra da metade */}
            <rect x="12" y="2" width="6" height="4" fill={shadow} />
            <rect x="16" y="6" width="2" height="3" fill={shadow} />
          </>
        )}
        {hair === 2 && ( /* Moicano Alto */
          <>
            <rect x="10" y="0" width="4" height="6" fill={hairColor} />
            <rect x="12" y="0" width="2" height="6" fill={shadow} />
            
            <rect x="8" y="2" width="8" height="2" fill={hairColor} />
            <rect x="12" y="2" width="4" height="2" fill={shadow} />
          </>
        )}
        {hair === 3 && ( /* Ocultando a orelha dir e esq com franjao */
          <>
            <rect x="5" y="3" width="14" height="4" fill={hairColor} />
            <rect x="12" y="3" width="7" height="4" fill={shadow} />
            
            {/* Franja caída pro lado direito */}
            <rect x="14" y="7" width="4" height="6" fill={hairColor} />
            <rect x="14" y="7" width="4" height="6" fill={shadow} />
            
            <rect x="5" y="7" width="2" height="4" fill={hairColor} />
          </>
        )}
        {hair === 4 && ( /* Topete Vintage */
          <>
             <rect x="5" y="2" width="14" height="6" fill={hairColor} />
             <rect x="6" y="1" width="12" height="1" fill={hairColor} />
             {/* Costeletas */}
             <rect x="5" y="8" width="2" height="4" fill={hairColor} />
             <rect x="17" y="8" width="2" height="4" fill={hairColor} />

             {/* Sombra metade direita absoluta para todo o cabelo */}
             <rect x="12" y="1" width="6" height="1" fill={shadow} />
             <rect x="12" y="2" width="7" height="6" fill={shadow} />
             <rect x="17" y="8" width="2" height="4" fill={shadow} />
          </>
        )}
      </g>

    </svg>
  );
};
