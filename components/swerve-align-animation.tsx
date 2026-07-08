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
          @media (prefers-reduced-motion: reduce) {
            .sw-wheel { animation: none; transform: rotate(0deg); }
          }
        `}</style>

        <defs>
          <marker id="sw-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-primary" />
          </marker>
        </defs>

        {/* chassis */}
        <rect x="40" y="60" width="160" height="200" rx="16" className="fill-muted stroke-border" strokeWidth="2" />

        {/* forward arrow */}
        <line
          x1="120"
          y1="18"
          x2="120"
          y2="55"
          className="stroke-primary"
          strokeWidth="3"
          markerEnd="url(#sw-arrowhead)"
        />
        <text x="120" y="12" textAnchor="middle" className="fill-primary text-[10px] font-semibold">
          FORWARD
        </text>

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
