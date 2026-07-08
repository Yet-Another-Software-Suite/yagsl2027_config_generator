"use client"

const MODULES = [
  { cx: 60, cy: 85, delay: "0s" },
  { cx: 180, cy: 85, delay: "0.15s" },
  { cx: 60, cy: 235, delay: "0.3s" },
  { cx: 180, cy: 235, delay: "0.45s" },
]

export function SwerveAlignAnimation() {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <svg
        viewBox="0 0 240 300"
        className="h-auto w-56 text-primary"
        role="img"
        aria-label="Animated diagram of a swerve module rotating from a random angle into the forward-facing, bevel-left orientation"
      >
        <style>{`
          .sw-wheel {
            transform-box: fill-box;
            transform-origin: center;
            animation: sw-align 3.2s ease-in-out infinite;
          }
          @keyframes sw-align {
            0%   { transform: rotate(55deg); }
            35%  { transform: rotate(55deg); }
            55%  { transform: rotate(0deg); }
            85%  { transform: rotate(0deg); }
            100% { transform: rotate(55deg); }
          }
          .sw-check {
            transform-box: fill-box;
            transform-origin: center;
            opacity: 0;
            animation: sw-check-fade 3.2s ease-in-out infinite;
          }
          @keyframes sw-check-fade {
            0%, 35%  { opacity: 0; }
            55%, 85% { opacity: 1; }
            100%     { opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .sw-wheel { animation: none; transform: rotate(0deg); }
            .sw-check { animation: none; opacity: 1; }
          }
        `}</style>

        {/* chassis */}
        <rect x="40" y="60" width="160" height="200" rx="16" className="fill-muted stroke-border" strokeWidth="2" />

        {/* front label */}
        <text x="120" y="80" textAnchor="middle" className="fill-primary text-[10px] font-semibold">
          front
        </text>

        {/* checkmark, shown once every module has settled into the aligned position -- delayed to
            match the last (slowest-staggered) module so it doesn't appear early */}
        <g className="sw-check" style={{ animationDelay: MODULES[MODULES.length - 1].delay }}>
          <circle cx="120" cy="160" r="16" className="fill-background stroke-green-600 dark:stroke-green-400" strokeWidth="2" />
          <path
            d="M112,160 L118,167 L130,150"
            fill="none"
            className="stroke-green-600 dark:stroke-green-400"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 4 wheel modules at each corner */}
        {MODULES.map((m, i) => (
          <g key={i} className="sw-wheel" style={{ animationDelay: m.delay }}>
            <rect x={m.cx - 8} y={m.cy - 18} width="16" height="36" rx="4" className="fill-foreground/80" />
            {/* bevel gear marker */}
            <rect x={m.cx - 10.5} y={m.cy - 4.5} width="5" height="9" rx="1" className="fill-yellow-500" />
          </g>
        ))}
      </svg>
      <p className="text-center text-xs text-muted-foreground">
        Each wheel settles pointing forward with the bevel gear (yellow rectangle) facing left
      </p>
    </div>
  )
}
