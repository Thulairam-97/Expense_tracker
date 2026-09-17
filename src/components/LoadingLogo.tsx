import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';

interface LoadingLogoProps {
  size?: number;
  statusMessage?: string;
  onFinished?: () => void;
  durationMs?: number;
}

const STATUS_STEPS = [
  'Verifying PIN & security credentials...',
  'Decrypting offline local expense ledger...',
  'Checking UPI Notification Interceptor...',
  'Ready! Loading personal dashboard...',
];

export const LoadingLogo: React.FC<LoadingLogoProps> = ({
  size = 80,
  statusMessage,
  onFinished,
  durationMs = 900,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < STATUS_STEPS.length - 1 ? prev + 1 : prev));
    }, Math.floor(durationMs / 3));

    const finishTimeout = setTimeout(() => {
      if (onFinished) onFinished();
    }, durationMs);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimeout);
    };
  }, [durationMs, onFinished]);

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center" style={{ width: size * 1.5, height: size * 1.5 }}>
        {/* Outer orbital rotating gradient ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            animationDuration: '1.6s',
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.2) 60%, #0F766E 100%)',
            padding: '3px',
          }}
        >
          <div className="w-full h-full bg-[#F8FAF9] rounded-full" />
        </div>

        {/* Ambient pulse glow */}
        <div
          className="absolute inset-2 rounded-full bg-teal-400/15 blur-xl animate-pulse"
          style={{ animationDuration: '1.2s' }}
        />

        {/* Center AppLogo with soft spring scale */}
        <div className="relative z-10 transform hover:scale-105 transition-transform duration-300">
          <AppLogo size={size} showGlow={true} />
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="mt-7 text-center">
        <p className="text-sm font-semibold text-slate-700 tracking-tight flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
          <span>{statusMessage || STATUS_STEPS[stepIndex]}</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">100% On-Device • Encrypted Local Vault</p>
      </div>
    </div>
  );
};
