"use client"

export function ControllerAnimation({
  stick,
  motion,
  direction,
  label,
}: {
  stick: "left" | "right"
  motion: "hold" | "cross"
  direction?: "left" | "right"
  label: string
}) {
  const activeCx = stick === "left" ? 88 : 132
  const inactiveCx = stick === "left" ? 132 : 88
  const holdClass = direction === "right" ? "ctrl-nub-hold-right" : "ctrl-nub-hold-left"

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <svg viewBox="0 0 220 130" className="h-auto w-52" role="img" aria-label={label}>
        <style>{`
          .ctrl-nub-hold-left { transform-box: fill-box; transform-origin: center; animation: ctrl-hold-left 3s ease-in-out infinite; }
          .ctrl-nub-hold-right { transform-box: fill-box; transform-origin: center; animation: ctrl-hold-right 3s ease-in-out infinite; }
          .ctrl-nub-cross { transform-box: fill-box; transform-origin: center; animation: ctrl-cross 4s ease-in-out infinite; }
          @keyframes ctrl-hold-left {
            0%, 10%   { transform: translate(0px, 0px); }
            25%, 75%  { transform: translate(-6px, 0px); }
            90%, 100% { transform: translate(0px, 0px); }
          }
          @keyframes ctrl-hold-right {
            0%, 10%   { transform: translate(0px, 0px); }
            25%, 75%  { transform: translate(6px, 0px); }
            90%, 100% { transform: translate(0px, 0px); }
          }
          @keyframes ctrl-cross {
            0%, 100% { transform: translate(0px, 0px); }
            20%      { transform: translate(0px, -8px); }
            40%      { transform: translate(0px, 0px); }
            55%      { transform: translate(0px, 8px); }
            70%      { transform: translate(0px, 0px); }
            80%      { transform: translate(-8px, 0px); }
            90%      { transform: translate(0px, 0px); }
            95%      { transform: translate(8px, 0px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .ctrl-nub-hold-left, .ctrl-nub-hold-right, .ctrl-nub-cross { animation: none; }
          }
        `}</style>

        {/* controller body */}
        <path
          d="M40,70 Q40,30 80,30 L140,30 Q180,30 180,70 Q180,105 155,105 Q140,105 132,90 L88,90 Q80,105 65,105 Q40,105 40,70 Z"
          className="fill-muted stroke-border"
          strokeWidth="2"
        />

        {/* d-pad */}
        <g className="fill-foreground/70">
          <rect x="58" y="52" width="8" height="24" rx="2" />
          <rect x="50" y="60" width="24" height="8" rx="2" />
        </g>

        {/* face buttons */}
        <g className="fill-foreground/70">
          <circle cx="150" cy="52" r="4" />
          <circle cx="158" cy="60" r="4" />
          <circle cx="150" cy="68" r="4" />
          <circle cx="142" cy="60" r="4" />
        </g>

        {/* inactive stick */}
        <circle cx={inactiveCx} cy="70" r="16" className="fill-background stroke-border" strokeWidth="1.5" />
        <circle cx={inactiveCx} cy="70" r="9" className="fill-foreground/30" />

        {/* active stick */}
        <circle cx={activeCx} cy="70" r="16" className="fill-background stroke-border" strokeWidth="1.5" />
        <circle
          cx={activeCx}
          cy="70"
          r="9"
          className={motion === "hold" ? `fill-primary ${holdClass}` : "fill-primary ctrl-nub-cross"}
        />
      </svg>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
