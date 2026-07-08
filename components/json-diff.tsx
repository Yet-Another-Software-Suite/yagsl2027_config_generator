import type React from "react"

export interface JsonDiffLine {
  text: string
  changed?: boolean
}

function CodeLines({ lines }: { lines: JsonDiffLine[] }) {
  return (
    <pre className="overflow-x-auto rounded bg-muted p-2.5 text-xs leading-relaxed">
      <code className="font-mono">
        {lines.map((line, i) => (
          <div key={i} className={line.changed ? "-mx-1 rounded bg-green-600/15 px-1 font-medium text-foreground" : undefined}>
            {line.text || " "}
          </div>
        ))}
      </code>
    </pre>
  )
}

export function JsonDiff({
  filename,
  before,
  after,
}: {
  filename: string
  before: JsonDiffLine[]
  after: JsonDiffLine[]
}): React.ReactElement {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{filename}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Before</p>
          <CodeLines lines={before} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">After</p>
          <CodeLines lines={after} />
        </div>
      </div>
    </div>
  )
}
