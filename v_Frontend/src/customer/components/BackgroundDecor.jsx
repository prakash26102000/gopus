import React from 'react';

// Lightweight decorative background using Tailwind utilities only.
// - Two blurred gradient blobs
// - Subtle grid overlay
// - Completely non-interactive and behind content
// - Works well with light themes
const BackgroundDecor = () => {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.04)_1px,_transparent_1px)] [background-size:24px_24px]"
      />

      {/* Gradient blobs */}
      <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 blur-3xl opacity-60" />
      <div className="absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-pink-200 via-rose-200 to-amber-200 blur-3xl opacity-60" />

      {/* Soft vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

export default BackgroundDecor;
