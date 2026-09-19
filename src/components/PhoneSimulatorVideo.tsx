import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  Bell,
  ShieldCheck,
  Send,
  Smartphone,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight,
  Layers,
  Fingerprint,
  Zap,
} from 'lucide-react';

interface Scene {
  id: number;
  title: string;
  subtitle: string;
  durationMs: number;
  badge: string;
}

const SCENES: Scene[] = [
  {
    id: 0,
    title: 'Android 11 Settings (One-Time Setup)',
    subtitle: 'Grant Notification Access in Device & App Notifications (No restricted setting blocks on Android 11!)',
    durationMs: 7000,
    badge: 'Step 1: Permission',
  },
  {
    id: 1,
    title: 'PhonePe: Paying ₹1 to Rahul',
    subtitle: 'User enters ₹1 in PhonePe to friend Rahul Sharma and completes UPI payment',
    durationMs: 8000,
    badge: 'Step 2: Payment',
  },
  {
    id: 2,
    title: 'Background Android Notification Intercept',
    subtitle: 'PhonePe pushes payment notification; Background service captures and auto-records ₹1 instantly',
    durationMs: 7000,
    badge: 'Step 3: Auto-Detect',
  },
  {
    id: 3,
    title: 'Actionable Notification (1-Tap Categorization)',
    subtitle: 'Android notification banner appears with category chips. Tapping "👥 Friend" categorizes it in 1 tap',
    durationMs: 7000,
    badge: 'Step 4: Categorize',
  },
  {
    id: 4,
    title: 'Reflected in UPI Expense Tracker App',
    subtitle: 'Open the app: ₹1 payment is already logged under Friends, analytics & daily total updated!',
    durationMs: 7000,
    badge: 'Step 5: Verified',
  },
];

export const PhoneSimulatorVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [sceneProgress, setSceneProgress] = useState<number>(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [manualTapCategory, setManualTapCategory] = useState<string | null>(null);

  // Animation frame loop for video playback
  const lastTimeRef = useRef<number | null>(null);
  const sceneProgressRef = useRef<number>(0);
  const currentSceneIndexRef = useRef<number>(0);

  sceneProgressRef.current = sceneProgress;
  currentSceneIndexRef.current = currentSceneIndex;

  useEffect(() => {
    let animId: number;

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) * playbackSpeed;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        const scene = SCENES[currentSceneIndexRef.current];
        const newProgress = sceneProgressRef.current + delta / scene.durationMs;

        if (newProgress >= 1) {
          if (currentSceneIndexRef.current < SCENES.length - 1) {
            setCurrentSceneIndex((prev) => prev + 1);
            setSceneProgress(0);
          } else {
            // Loop back to start or pause
            setCurrentSceneIndex(0);
            setSceneProgress(0);
          }
        } else {
          setSceneProgress(newProgress);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed]);

  const handleSeekScene = (index: number) => {
    setCurrentSceneIndex(index);
    setSceneProgress(0);
    lastTimeRef.current = null;
  };

  const handleRestart = () => {
    setCurrentSceneIndex(0);
    setSceneProgress(0);
    setIsPlaying(true);
    setManualTapCategory(null);
    lastTimeRef.current = null;
  };

  const totalProgress =
    (currentSceneIndex + sceneProgress) / SCENES.length;

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Simulated Video
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              Android 11 Workflow
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            How UPI Expense Tracker Works on Your Mobile
          </h2>
          <p className="text-xs text-slate-500">
            Step-by-step video simulation of sending ₹1 on PhonePe and auto-recording with zero manual effort.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Video
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Play Video
              </>
            )}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Restart Video from Scene 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              setPlaybackSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))
            }
            className="px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl border border-slate-200"
            title="Change Playback Speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Main Video Presentation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: The Animated Smartphone Device */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-[320px] sm:w-[340px] h-[660px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden select-none">
            {/* Top Phone Ear Speaker & Front Camera Hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
              <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-700 ring-1 ring-slate-800" />
            </div>

            {/* Android 11 Status Bar */}
            <div className="w-full pt-4 pb-1 px-4 flex items-center justify-between text-[11px] text-white/90 font-medium z-30 select-none">
              <span>10:30 AM</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span>VoLTE</span>
                <span className="text-[10px]">4G</span>
                <span>📶</span>
                <span>🔋 85%</span>
              </div>
            </div>

            {/* Active Simulated Screen Content */}
            <div className="relative flex-1 bg-slate-100 rounded-[32px] overflow-hidden flex flex-col">
              {/* Scene 0: Android 11 Settings (Notification Access) */}
              {currentSceneIndex === 0 && (
                <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
                  {/* Android 11 Settings Top AppBar */}
                  <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2 shadow-xs">
                    <span className="text-slate-500 text-lg">←</span>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 leading-tight">
                        Device & app notifications
                      </h4>
                      <p className="text-[10px] text-slate-500">Special app access • Android 11</p>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                    <div className="text-[11px] text-slate-500 px-1 py-1">
                      Apps allowed to read notification alerts:
                    </div>

                    {/* App item 1 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                          ₹
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">UPI Expense Tracker</p>
                          <p className="text-[10px] text-teal-600 font-medium">
                            {sceneProgress > 0.4 ? 'Allowed' : 'Not allowed'}
                          </p>
                        </div>
                      </div>

                      {/* Animated Android Toggle Switch */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-500 p-0.5 flex items-center ${
                          sceneProgress > 0.4 ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                      </div>
                    </div>

                    {/* Other apps for realism */}
                    <div className="bg-white/60 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          G
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Google Play Services</p>
                          <p className="text-[10px] text-slate-400">Allowed</p>
                        </div>
                      </div>
                      <div className="w-11 h-6 rounded-full bg-indigo-500 p-0.5 flex items-center justify-end">
                        <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                      </div>
                    </div>

                    {/* Android 11 Native Modal Dialog (appears midway through scene) */}
                    {sceneProgress >= 0.25 && sceneProgress <= 0.85 && (
                      <div className="absolute inset-x-3 bottom-12 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1.5">
                          <ShieldCheck className="w-4 h-4 text-teal-600" />
                          Allow notification access?
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
                          UPI Expense Tracker will be able to read payment notifications to automatically detect PhonePe, GPay, and bank SMS transactions.
                        </p>
                        <div className="flex justify-end gap-2">
                          <span className="text-[11px] text-slate-500 px-2 py-1 font-medium">Cancel</span>
                          <span
                            className={`text-[11px] px-3 py-1 font-bold rounded-lg transition-all ${
                              sceneProgress > 0.4
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'text-teal-700 bg-teal-50'
                            }`}
                          >
                            Allow
                          </span>
                        </div>

                        {/* Simulated Tap Touch Ripple */}
                        {sceneProgress > 0.38 && sceneProgress < 0.5 && (
                          <div className="absolute right-5 bottom-4 w-6 h-6 rounded-full bg-teal-400/40 animate-ping pointer-events-none" />
                        )}
                      </div>
                    )}

                    <div className="mt-4 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-[10px] text-teal-800">
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Android 11 Advantage:
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        No "Restricted Setting" lock on Android 11. Toggling switch ON grants access immediately!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 1: PhonePe App (Paying ₹1 to Rahul) */}
              {currentSceneIndex === 1 && (
                <div className="flex-1 flex flex-col bg-[#5f259f] text-white">
                  {/* PhonePe Header */}
                  <div className="p-3.5 flex items-center justify-between border-b border-purple-800/60 bg-[#521e8d]">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-base">←</span>
                      <div>
                        <h4 className="font-bold text-xs text-white">Rahul Sharma</h4>
                        <p className="text-[9px] text-purple-200">+91 98765 43210 • UPI ID: rahul@ybl</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-purple-700 px-2 py-0.5 rounded font-mono">Verified</span>
                  </div>

                  {/* PhonePe Chat / Payment Body */}
                  <div className="flex-1 p-4 flex flex-col justify-between bg-gradient-to-b from-[#5f259f] to-[#431773]">
                    <div className="space-y-3">
                      <div className="text-center text-[10px] text-purple-200 bg-purple-900/40 py-1 rounded-full w-24 mx-auto">
                        Today, 10:30 AM
                      </div>

                      {/* Payment Card Animation */}
                      <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl max-w-[240px] mx-auto text-center border border-purple-100">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-[#5f259f] flex items-center justify-center font-bold text-base mx-auto mb-1">
                          RS
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Paying to Rahul Sharma</p>

                        <div className="my-2">
                          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            ₹{sceneProgress > 0.2 ? '1' : '0'}
                          </span>
                        </div>

                        <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md mb-3 inline-block">
                          Remark: Test transfer
                        </div>

                        {/* UPI Payment Status */}
                        {sceneProgress > 0.65 ? (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Payment Successful!
                          </div>
                        ) : (
                          <div className="w-full bg-[#5f259f] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md">
                            <Send className="w-3 h-3" />
                            Pay ₹1
                          </div>
                        )}
                      </div>

                      {/* Simulated UPI PIN Entry (appears midway) */}
                      {sceneProgress > 0.35 && sceneProgress <= 0.65 && (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-center shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-2">
                          <p className="text-[10px] text-slate-400 font-medium">ENTER 4-DIGIT UPI PIN</p>
                          <div className="flex justify-center gap-2 my-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                          <p className="text-[9px] text-emerald-400">Verifying with Bank...</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[9px] text-purple-300 flex items-center justify-center gap-1">
                      <span>🔒 Powered by UPI NPCI</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 2: Background Notification Intercept */}
              {currentSceneIndex === 2 && (
                <div className="flex-1 flex flex-col bg-slate-900 text-white relative">
                  {/* Android Home Screen Wallpaper Wallpaper */}
                  <div className="flex-1 p-4 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950">
                    {/* Top Status Bar Notification Dropdown Banner */}
                    <div className="w-full animate-in slide-in-from-top duration-300">
                      {/* PhonePe Push Notification */}
                      <div className="bg-slate-800/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#5f259f] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          P
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-200">PhonePe</span>
                            <span className="text-[9px] text-slate-400">now</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-0.5 leading-snug">
                            Paid ₹1 to Rahul Sharma
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono">
                            Txn ID: T240918123456 • Successful
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Behind the scenes Native Service Radar Visualization */}
                    <div className="bg-slate-950/80 border border-teal-500/30 p-3 rounded-2xl my-auto text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-teal-500/5 animate-pulse" />
                      <div className="flex items-center justify-center gap-1.5 text-teal-400 text-xs font-bold mb-1">
                        <Zap className="w-4 h-4 text-teal-400 animate-bounce" />
                        Native Service Active in Background
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        <code className="text-teal-300">PaymentNotificationListenerService</code> detected PhonePe broadcast
                      </p>

                      <div className="mt-2.5 bg-slate-900 p-2 rounded-lg text-left font-mono text-[9px] text-slate-300 border border-slate-800 space-y-1">
                        <div className="text-emerald-400">✓ Regex match: "Paid ₹1 to Rahul Sharma"</div>
                        <div>• Amount: <span className="text-white font-bold">₹1.00</span></div>
                        <div>• Payee: <span className="text-white font-bold">Rahul Sharma</span></div>
                        <div>• Source: <span className="text-purple-300">PhonePe (UPI)</span></div>
                        <div className="text-teal-400">✓ Auto-saved to SharedPreferences!</div>
                      </div>
                    </div>

                    {/* Android Dock Icons */}
                    <div className="flex items-center justify-around py-2 border-t border-slate-800/80">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 ring-teal-400">
                        ₹
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#5f259f] flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        P
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        G
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        💬
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 3: Actionable Notification with Category Buttons */}
              {currentSceneIndex === 3 && (
                <div className="flex-1 flex flex-col bg-slate-900 text-white relative">
                  <div className="flex-1 p-3 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                    {/* Actionable Notification Card in Android Notification Shade */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold px-1">
                        Android Notification Shade
                      </div>

                      {/* The Actionable Notification */}
                      <div className="bg-slate-800 text-white p-3.5 rounded-2xl border-2 border-teal-500/50 shadow-2xl animate-in slide-in-from-top-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-teal-400 flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5" /> UPI Expense Tracker
                          </span>
                          <span className="text-[9px] text-slate-400">Just now</span>
                        </div>

                        <div className="text-xs font-bold text-white">
                          ₹1 paid to Rahul Sharma
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Auto-recorded (PhonePe) • Tap a category:
                        </p>

                        {/* Interactive Category Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                          <button
                            onClick={() => setManualTapCategory('cat_food')}
                            className="bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-[10px] font-bold py-1.5 px-2 rounded-lg text-left transition-all"
                          >
                            🍔 Food & Drinks
                          </button>
                          <button
                            onClick={() => setManualTapCategory('cat_groceries')}
                            className="bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-[10px] font-bold py-1.5 px-2 rounded-lg text-left transition-all"
                          >
                            🛒 Grocery
                          </button>
                          <button
                            onClick={() => setManualTapCategory('cat_fuel')}
                            className="bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-[10px] font-bold py-1.5 px-2 rounded-lg text-left transition-all"
                          >
                            ⛽ Fuel
                          </button>
                          <button
                            onClick={() => setManualTapCategory('cat_transfer')}
                            className={`text-[10px] font-bold py-1.5 px-2 rounded-lg text-left transition-all relative ${
                              sceneProgress > 0.4 || manualTapCategory === 'cat_transfer'
                                ? 'bg-teal-600 text-white ring-2 ring-teal-300'
                                : 'bg-slate-700/80 text-slate-200'
                            }`}
                          >
                            👥 Friend / Personal
                            {/* Simulated tap pointer indicator */}
                            {sceneProgress > 0.35 && sceneProgress < 0.6 && (
                              <div className="absolute right-1 top-1 w-4 h-4 bg-teal-300 rounded-full animate-ping pointer-events-none" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Toast Confirmation */}
                      {(sceneProgress > 0.5 || manualTapCategory) && (
                        <div className="bg-teal-900/90 border border-teal-500 text-teal-100 p-2.5 rounded-xl text-[10px] font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>Categorized as "Friend / Personal Transfer"</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 text-[10px] text-slate-300">
                      <p className="font-bold text-slate-200">Zero Manual Entry Guarantee:</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Even if you ignore or swipe away this notification, the ₹1 expense is already safely stored in local memory!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scene 4: Reflected in UPI Expense Tracker App */}
              {currentSceneIndex === 4 && (
                <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
                  {/* App Header */}
                  <div className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center text-white text-xs font-bold">
                        ₹
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Personal Tracker</h4>
                        <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Listening Active (Android 11)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                      Offline
                    </span>
                  </div>

                  {/* App Body */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
                    {/* Spending Summary Card */}
                    <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white p-3.5 rounded-2xl shadow-md">
                      <div className="flex justify-between items-center text-[10px] text-teal-200">
                        <span>TODAY'S SPENDING</span>
                        <span className="bg-teal-600/60 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                      </div>
                      <div className="text-2xl font-black tracking-tight mt-1">
                        ₹1<span className="text-sm font-normal text-teal-200">.00</span>
                      </div>
                      <p className="text-[9px] text-teal-200 mt-1">
                        1 new transaction detected from PhonePe
                      </p>
                    </div>

                    {/* Recent Transactions List */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5 px-0.5">
                        <span>Recent Transactions</span>
                        <span className="text-[9px] text-teal-700">Auto-Logged</span>
                      </div>

                      {/* The Auto-Recorded Transaction Item */}
                      <div className="bg-white p-2.5 rounded-xl border-2 border-teal-500/40 shadow-xs flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5f259f] flex items-center justify-center font-bold text-xs">
                            P
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Rahul Sharma</p>
                            <p className="text-[9px] text-slate-500 flex items-center gap-1">
                              <span>Today, 10:30 AM</span> •
                              <span className="text-teal-700 font-semibold">👥 Friend</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-slate-900 block">
                            -₹1.00
                          </span>
                          <span className="text-[8px] bg-purple-50 text-[#5f259f] font-semibold px-1.5 py-0.5 rounded border border-purple-200">
                            PhonePe
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category Chart Mockup */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-700 mb-1">Category Allocation</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-teal-600 h-full w-full" title="Friends: 100%" />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                        <span>Friend & Family (100%)</span>
                        <span className="font-bold text-slate-800">₹1.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Android 11 Bottom Navigation Pill Bar */}
            <div className="w-full py-2 flex items-center justify-center z-30">
              <div className="w-24 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Scene Navigation, Explanation & Android 11 Checklist */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Scene Explanation Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {SCENES[currentSceneIndex].badge}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Scene {currentSceneIndex + 1} of {SCENES.length}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {SCENES[currentSceneIndex].title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {SCENES[currentSceneIndex].subtitle}
            </p>

            {/* Video Progress Bar for Current Scene */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                <span>Timeline</span>
                <span>{Math.round(totalProgress * 100)}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${totalProgress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Scene Jump Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              Jump to Video Chapter
            </h4>

            <div className="space-y-1.5">
              {SCENES.map((scene, idx) => {
                const isCurrent = currentSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSeekScene(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-teal-50 border border-teal-200 text-teal-900 font-bold shadow-xs'
                        : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          isCurrent
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span>{scene.title}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                        Playing
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Android 11 Specific Compatibility Checklist */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-950">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Android 11 Execution Checklist
            </h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">1.</span>
                <p>
                  <strong>No Restricted Setting block:</strong> On Android 11, you can toggle Notification Access ON immediately with no special 3-dot menus.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">2.</span>
                <p>
                  <strong>Package Visibility (`&lt;queries&gt;`):</strong> Explicitly configured for `com.phonepe.app`, GPay, Paytm, and SMS messaging apps in AndroidManifest.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">3.</span>
                <p>
                  <strong>Battery Optimization:</strong> In Phone Settings &gt; Apps &gt; UPI Tracker &gt; Battery, set to <strong>"Unrestricted"</strong> to prevent Android 11 from stopping the listener.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
