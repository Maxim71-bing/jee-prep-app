import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const FlipUnit = ({ digit }: { digit: string }) => {
  return (
    <div className="relative w-14 h-20 sm:w-20 sm:h-28 bg-[#eaddff] dark:bg-gray-800 rounded-lg flex items-center justify-center text-4xl sm:text-6xl font-bold text-[#21005d] dark:text-purple-200 shadow-md overflow-hidden border border-[#cac4d0] dark:border-gray-700">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={digit}
          initial={{ y: '50%', opacity: 0, scale: 0.9 }}
          animate={{ y: '0%', opacity: 1, scale: 1 }}
          exit={{ y: '-50%', opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.div>
      </AnimatePresence>
      {/* Horizontal line for flip clock effect */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/10 dark:bg-black/40 -translate-y-1/2 z-10 shadow-[0_1px_2px_rgba(255,255,255,0.1)]" />
    </div>
  );
};

export const FlipClock = ({ time }: { time: number }) => {
  const safeTime = Math.max(0, time);
  const m = Math.floor(safeTime / 60);
  const s = safeTime % 60;
  
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2 sm:gap-4 font-mono mb-8">
      <div className="flex gap-1 sm:gap-2">
        {mStr.split('').map((digit, i) => (
          <FlipUnit key={`m-${i}`} digit={digit} />
        ))}
      </div>
      <div className="text-4xl sm:text-6xl text-[#6750a4] dark:text-purple-400 font-bold mb-2 animate-pulse">:</div>
      <div className="flex gap-1 sm:gap-2">
        {sStr.split('').map((digit, i) => (
          <FlipUnit key={`s-${i}`} digit={digit} />
        ))}
      </div>
    </div>
  );
};
