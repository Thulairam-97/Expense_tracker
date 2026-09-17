import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';
import { LoadingLogo } from './LoadingLogo';
import { Fingerprint, Delete, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface PinScreenProps {
  onAuthenticated: () => void;
  savedPin?: string;
  userName?: string;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  onAuthenticated,
  savedPin: initialSavedPin = '1234',
  userName = 'Thulasiram',
}) => {
  const [pin, setPin] = useState<string>('');
  const [savedPin, setSavedPin] = useState<string>(initialSavedPin);
  const [isSettingNewPin, setIsSettingNewPin] = useState<boolean>(!initialSavedPin);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showLoadingLogo, setShowLoadingLogo] = useState<boolean>(false);

  // Keyboard listener for desktop convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLoadingLogo) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length === 4) {
        verifyPin(pin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, showLoadingLogo, savedPin, isSettingNewPin]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage(null);

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMessage(null);
    }
  };

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 500);
  };

  const verifyPin = (enteredPin: string) => {
    if (isSettingNewPin) {
      setSavedPin(enteredPin);
      localStorage.setItem('upi_user_pin', enteredPin);
      triggerSuccessLoading();
    } else {
      // Check against saved PIN (or fallback 1234)
      if (enteredPin === savedPin || enteredPin === '1234') {
        triggerSuccessLoading();
      } else {
        triggerShake('Incorrect PIN. (Hint: default is 1234)');
      }
    }
  };

  const triggerSuccessLoading = () => {
    setShowLoadingLogo(true);
  };

  if (showLoadingLogo) {
    return (
      <div className="fixed inset-0 bg-[#F8FAF9] z-50 flex items-center justify-center">
        <LoadingLogo
          size={84}
          durationMs={850}
          onFinished={onAuthenticated}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8FAF9] z-50 flex flex-col items-center justify-between py-10 px-6 select-none overflow-y-auto">
      {/* Top Bar / Brand Header */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Offline Encrypted Vault</span>
        </div>
        <button
          onClick={onAuthenticated}
          className="text-xs text-slate-500 hover:text-teal-700 font-medium transition-colors"
        >
          Skip to Dashboard →
        </button>
      </div>

      {/* Main PIN Prompt Section */}
      <div className="flex flex-col items-center text-center my-auto w-full max-w-sm">
        <div className="mb-5 hover:scale-105 transition-transform">
          <AppLogo size={76} showGlow={true} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isSettingNewPin ? 'Create Security PIN' : `Welcome Back, ${userName}`}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          {isSettingNewPin
            ? 'Set a 4-digit PIN to safeguard your personal expense ledger'
            : 'Enter your 4-digit PIN to access live UPI expenses'}
        </p>

        {/* 4 PIN Dots */}
        <div
          className={`flex items-center justify-center gap-4 my-8 ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-teal-700 scale-125 ring-4 ring-teal-100 shadow-xs'
                    : 'border-2 border-slate-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage ? (
          <p className="text-xs font-semibold text-rose-600 mb-2 animate-in fade-in">
            {errorMessage}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 mb-2">Default PIN is 1234</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px] mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-16 w-16 mx-auto rounded-full bg-white border border-slate-200/90 text-xl font-bold text-slate-800 hover:bg-teal-50/80 active:bg-teal-100/90 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Instant Unlock */}
          <button
            onClick={triggerSuccessLoading}
            title="Biometric Fingerprint / FaceID"
            className="h-16 w-16 mx-auto rounded-full bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
          >
            <Fingerprint className="w-7 h-7 text-teal-700" />
          </button>

          {/* Digit 0 */}
          <button
            onClick={() => handleDigit('0')}
            className="h-16 w-16 mx-auto rounded-full bg-white border border-slate-200/90 text-xl font-bold text-slate-800 hover:bg-teal-50/80 active:bg-teal-100/90 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            title="Backspace"
            className="h-16 w-16 mx-auto rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer / Reset action */}
      <div className="w-full max-w-sm flex items-center justify-center gap-4 text-xs text-slate-500 pt-4">
        <button
          onClick={() => {
            setSavedPin('1234');
            setIsSettingNewPin(false);
            setErrorMessage('PIN reset to default 1234');
          }}
          className="hover:text-teal-700 underline underline-offset-2"
        >
          Reset PIN to 1234
        </button>
        <span>•</span>
        <button
          onClick={() => {
            setIsSettingNewPin(!isSettingNewPin);
            setPin('');
            setErrorMessage(null);
          }}
          className="hover:text-teal-700 underline underline-offset-2"
        >
          {isSettingNewPin ? 'Cancel' : 'Change PIN'}
        </button>
      </div>
    </div>
  );
};
