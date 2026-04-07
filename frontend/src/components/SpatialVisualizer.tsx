import React from 'react';

interface SpatialVisualizerProps {
  isPlaying: boolean;
  currentDirection?: string;
  accuracy: number;
  latency: number;
}

export default function SpatialVisualizer({
  isPlaying,
  currentDirection,
  accuracy,
  latency,
}: SpatialVisualizerProps) {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2">
        <div className="glass-panel rounded-[24px] border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Accuracy Score</p>
          <p className="mt-3 text-4xl font-black text-cyan-300">{accuracy.toFixed(1)}%</p>
        </div>
        <div className="glass-panel rounded-[24px] border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latency</p>
          <p className="mt-3 text-4xl font-black text-blue-300">{latency.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Main Circular Visualizer */}
      <div className="glass-panel rounded-[32px] border border-white/10 p-8 relative overflow-hidden">
        <div className="relative aspect-square max-w-md mx-auto">
          {/* Background gradient circle */}
          <svg
            className="w-full h-full absolute inset-0"
            viewBox="0 0 300 300"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.2))' }}
          >
            {/* Outer circle */}
            <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="1" />
            {/* Middle circle */}
            <circle
              cx="150"
              cy="150"
              r="100"
              fill="none"
              stroke="rgba(34, 211, 238, 0.15)"
              strokeWidth="1"
            />
            {/* Inner circle */}
            <circle cx="150" cy="150" r="60" fill="none" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="1" />

            {/* Directional lines */}
            <line x1="150" y1="20" x2="150" y2="60" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="2" />
            <line x1="150" y1="240" x2="150" y2="280" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="2" />
            <line x1="20" y1="150" x2="60" y2="150" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="2" />
            <line x1="240" y1="150" x2="280" y2="150" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="2" />
          </svg>

          {/* Labels */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-4">
            <p className="text-xs uppercase tracking-widest font-bold text-cyan-300">FRONT</p>
            <p className="text-xs uppercase tracking-widest font-bold text-cyan-300">BACK</p>
          </div>

          <div className="absolute inset-0 flex items-center justify-between px-4">
            <p className="text-xs uppercase tracking-widest font-bold text-cyan-300">LEFT</p>
            <p className="text-xs uppercase tracking-widest font-bold text-cyan-300">RIGHT</p>
          </div>

          {/* Center user indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing outer ring */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-pulse" />
              )}

              {/* Main user circle */}
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-glow">
                👤
              </div>
            </div>
          </div>

          {/* Directional indicators */}
          {currentDirection && (
            <>
              {currentDirection === 'left' && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 animate-pulse">
                  <div className="text-2xl animate-bounce">←</div>
                </div>
              )}
              {currentDirection === 'right' && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-pulse">
                  <div className="text-2xl animate-bounce">→</div>
                </div>
              )}
              {currentDirection === 'front' && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse">
                  <div className="text-2xl animate-bounce">↑</div>
                </div>
              )}
              {currentDirection === 'back' && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 animate-pulse">
                  <div className="text-2xl animate-bounce">↓</div>
                </div>
              )}
            </>
          )}

          {/* Glow effects on sides when playing */}
          {isPlaying && (
            <>
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-16 rounded-full bg-cyan-400 blur-lg opacity-40 animate-pulse"
                style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
              />
              <div
                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 rounded-full bg-blue-400 blur-lg opacity-40 animate-pulse"
                style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
