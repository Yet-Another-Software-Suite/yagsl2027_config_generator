export function ModuleLocationDiagram() {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <svg
        viewBox="0 0 240 300"
        className="h-auto w-56"
        role="img"
        aria-label="Diagram showing module location measured from the center of the robot to the center of a module"
      >
        <rect x="40" y="60" width="160" height="200" rx="16" className="fill-muted stroke-border" strokeWidth="2" />

        {/* center of robot */}
        <circle cx="120" cy="160" r="3" className="fill-foreground" />
        <text x="126" y="158" className="fill-foreground text-[10px]">
          center of robot
        </text>

        {/* example module, top right */}
        <rect x="177" y="72" width="16" height="26" rx="3" className="fill-foreground/80" />
        <circle cx="185" cy="85" r="2.5" className="fill-foreground" />

        {/* front distance (vertical) */}
        <line x1="120" y1="160" x2="120" y2="85" className="stroke-primary" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="96" y="122" textAnchor="end" className="fill-primary text-[10px] font-medium">
          front
        </text>

        {/* left distance (horizontal) */}
        <line x1="120" y1="85" x2="185" y2="85" className="stroke-primary" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="152" y="78" textAnchor="middle" className="fill-primary text-[10px] font-medium">
          left
        </text>
      </svg>
      <p className="text-center text-xs text-muted-foreground">
        Both distances are measured from the center of the robot to the center of the module (wheel), in inches
      </p>
    </div>
  )
}
