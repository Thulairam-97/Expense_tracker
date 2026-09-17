import React from 'react';

interface AppLogoProps {
  size?: number;
  showGlow?: boolean;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 64,
  showGlow = true,
  className = '',
}) => {
  const borderRadius = Math.round(size * 0.28);

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: `${borderRadius}px`,
        background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
        boxShadow: showGlow
          ? '0 10px 25px -5px rgba(15, 118, 110, 0.45), 0 8px 10px -6px rgba(15, 118, 110, 0.3)'
          : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Glossy top reflection highlight */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none rounded-t-[inherit]"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0))',
        }}
      />

      {/* Stylized Vector Glyph */}
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-sm"
      >
        {/* Top horizontal rupee bar */}
        <line
          x1="14"
          y1="16"
          x2="50"
          y2="16"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Second horizontal rupee bar */}
        <line
          x1="14"
          y1="27"
          x2="44"
          y2="27"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Main curved spine */}
        <path
          d="M23 16V34C23 41 38 41 38 34"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Instantaneous zero-touch lightning diagonal stroke */}
        <path
          d="M22 35L48 54H38"
          stroke="#34D399"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glowing spark dot */}
        <circle cx="48" cy="54" r="2.5" fill="#A7F3D0" />
      </svg>
    </div>
  );
};
