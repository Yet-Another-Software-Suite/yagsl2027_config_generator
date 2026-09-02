"use client"

function AzimuthPanel() {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-center text-xs font-semibold text-foreground">Angle (azimuth) motor</p>
      <svg
        viewBox="0 0 120 120"
        className="mx-auto h-auto w-28"
        role="img"
        aria-label="A swerve module rotating in place to change its steering direction: this is the angle motor, not the drive wheel"
      >
        <style>{`
          .az-wheel { transform-box: fill-box; transform-origin: center; animation: az-spin 3s linear infinite; }
          @keyframes az-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { .az-wheel { animation: none; } }
        `}</style>
        {/* mounting base: fixed to the chassis, doesn't move */}
        <circle cx="60" cy="60" r="40" className="fill-muted stroke-border" strokeWidth="2" />
        {/* the whole wheel assembly turns to a new heading */}
        <g className="az-wheel">
          <rect x="52" y="30" width="16" height="60" rx="4" className="fill-foreground/80" />
          <rect x="41.5" y="55" width="5" height="10" rx="1" className="fill-yellow-500" />
        </g>
        <circle cx="60" cy="60" r="3" className="fill-foreground" />
      </svg>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Turns the wheel to point a new direction: this is what the angle PID controls.
      </p>
    </div>
  )
}

function DrivePanel() {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-center text-xs font-semibold text-foreground">Drive motor</p>
      <svg
        viewBox="0 0 120 120"
        className="mx-auto h-auto w-28"
        role="img"
        aria-label="A swerve module's wheel spinning in place to roll forward, with its steering direction unchanged: this is the drive motor, not the angle motor"
      >
        <style>{`
          .dr-tread { animation: dr-scroll 0.6s linear infinite; }
          @keyframes dr-scroll { from { transform: translateY(0px); } to { transform: translateY(12px); } }
          @media (prefers-reduced-motion: reduce) { .dr-tread { animation: none; } }
        `}</style>
        <circle cx="60" cy="60" r="40" className="fill-muted stroke-border" strokeWidth="2" />
        {/* wheel housing: heading stays fixed, only the tread inside "rolls" */}
        <rect x="52" y="30" width="16" height="60" rx="4" className="fill-foreground/80" />
        <rect x="41.5" y="55" width="5" height="10" rx="1" className="fill-yellow-500" />
        <defs>
          <clipPath id="dr-clip">
            <rect x="52" y="30" width="16" height="60" rx="4" />
          </clipPath>
        </defs>
        <g clipPath="url(#dr-clip)">
          <g className="dr-tread">
            {[26, 38, 50, 62, 74, 86].map((y) => (
              <rect key={y} x="52" y={y} width="16" height="3" className="fill-background/70" />
            ))}
          </g>
        </g>
      </svg>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Spins the wheel to roll forward/backward, without changing its heading: this is what the drive PID
        controls.
      </p>
    </div>
  )
}

export function ModuleMotorAnimation() {
  // break-inside:avoid isn't reliably honored on the grid box itself in every print engine
  // (Safari/WebKit in particular), so it goes on this plain wrapper instead
  return (
    <div className="print-avoid-break">
      <div className="grid gap-3 sm:grid-cols-2">
        <AzimuthPanel />
        <DrivePanel />
      </div>
    </div>
  )
}
