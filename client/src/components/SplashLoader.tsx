import React, { useEffect, useState } from 'react';
import { Building } from 'lucide-react';

const SplashLoader: React.FC = () => {
  const [mounted, setMounted] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out animation after 1.8s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    // Unmount from DOM after fade out completes (2.3s total)
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-slate-100 transition-opacity duration-500 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Abstract Glowing Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Animated Glowing Logo */}
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-650 flex items-center justify-center text-white border border-indigo-500/40 shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-bounce duration-1000">
          <Building className="h-10 w-10 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
        </div>

        {/* Text Details with Slide & Fade */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400 drop-shadow-sm">
            SOCIETY PORTAL
          </h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em] animate-pulse">
            Connecting Communities, Smartly
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 mt-4">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[loadingProgress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default SplashLoader;
