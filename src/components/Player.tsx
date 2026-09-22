"use client";

import { useRef, useState } from "react";

export function Player({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }

  return (
    <div className="card p-5 flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Abspielen"}
        className="h-24 w-24 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-3xl flex items-center justify-center"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${progress * 100}%` }} />
      </div>
      <audio
        ref={ref}
        src={src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress(a.currentTime / a.duration);
        }}
      />
    </div>
  );
}
