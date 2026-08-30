"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { withBasePath } from "@/lib/base-path"

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 540
const GROUND_HEIGHT = 36
const RIVET_SIZE = 34
const RIVET_X = 90
const GRAVITY = 0.45
const FLAP_VELOCITY = -7.6
const MAX_FALL_SPEED = 9
const PIPE_WIDTH = 54
const PIPE_GAP = 150
const PIPE_SPACING = 210
const PIPE_SPEED = 2.6
const HIGH_SCORE_KEY = "flappy-rivet-high-score"

type Pipe = {
  x: number
  gapY: number
  passed: boolean
}

type GameState = "ready" | "playing" | "paused" | "gameover"

export function FlappyRivetGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rivetImgRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)

  // Mutable game data lives in refs so the render loop doesn't fight React's render cycle.
  const rivetYRef = useRef(CANVAS_HEIGHT / 2)
  const velocityRef = useRef(0)
  const pipesRef = useRef<Pipe[]>([])
  const scoreRef = useRef(0)
  const stateRef = useRef<GameState>("ready")

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameState, setGameState] = useState<GameState>("ready")

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) ?? 0)
    if (Number.isFinite(stored)) setHighScore(stored)

    const img = new window.Image()
    img.src = withBasePath("/rivet.png")
    rivetImgRef.current = img
  }, [])

  const resetGame = useCallback(() => {
    rivetYRef.current = CANVAS_HEIGHT / 2
    velocityRef.current = 0
    pipesRef.current = [
      { x: CANVAS_WIDTH + 120, gapY: CANVAS_HEIGHT / 2, passed: false },
    ]
    scoreRef.current = 0
    setScore(0)
  }, [])

  const setState = useCallback((next: GameState) => {
    stateRef.current = next
    setGameState(next)
  }, [])

  const flap = useCallback(() => {
    const current = stateRef.current
    if (current === "ready") {
      resetGame()
      setState("playing")
      velocityRef.current = FLAP_VELOCITY
      return
    }
    if (current === "gameover") {
      resetGame()
      setState("playing")
      velocityRef.current = FLAP_VELOCITY
      return
    }
    if (current === "playing") {
      velocityRef.current = FLAP_VELOCITY
    }
  }, [resetGame, setState])

  const togglePause = useCallback(() => {
    if (stateRef.current === "playing") setState("paused")
    else if (stateRef.current === "paused") setState("playing")
  }, [setState])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault()
        flap()
      } else if (e.code === "KeyP" || e.code === "Escape") {
        togglePause()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [flap, togglePause])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const endGame = () => {
      setState("gameover")
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        window.localStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current))
      }
    }

    const update = () => {
      if (stateRef.current === "playing") {
        velocityRef.current = Math.min(velocityRef.current + GRAVITY, MAX_FALL_SPEED)
        rivetYRef.current += velocityRef.current

        for (const pipe of pipesRef.current) {
          pipe.x -= PIPE_SPEED
          if (!pipe.passed && pipe.x + PIPE_WIDTH < RIVET_X - RIVET_SIZE / 2) {
            pipe.passed = true
            scoreRef.current += 1
            setScore(scoreRef.current)
          }
        }

        const last = pipesRef.current[pipesRef.current.length - 1]
        if (!last || CANVAS_WIDTH - last.x >= PIPE_SPACING) {
          const margin = 70
          const gapY = margin + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - margin * 2)
          pipesRef.current.push({ x: CANVAS_WIDTH + PIPE_WIDTH, gapY, passed: false })
        }

        pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > -10)

        const rivetTop = rivetYRef.current - RIVET_SIZE / 2
        const rivetBottom = rivetYRef.current + RIVET_SIZE / 2
        const rivetLeft = RIVET_X - RIVET_SIZE / 2
        const rivetRight = RIVET_X + RIVET_SIZE / 2

        if (rivetTop <= 0 || rivetBottom >= CANVAS_HEIGHT - GROUND_HEIGHT) {
          endGame()
        }

        for (const pipe of pipesRef.current) {
          const pipeLeft = pipe.x
          const pipeRight = pipe.x + PIPE_WIDTH
          if (rivetRight > pipeLeft && rivetLeft < pipeRight) {
            const gapTop = pipe.gapY - PIPE_GAP / 2
            const gapBottom = pipe.gapY + PIPE_GAP / 2
            if (rivetTop < gapTop || rivetBottom > gapBottom) {
              endGame()
              break
            }
          }
        }
      }

      draw()
      rafRef.current = requestAnimationFrame(update)
    }

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      sky.addColorStop(0, "#7dd3fc")
      sky.addColorStop(1, "#bae6fd")
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#57534e"
      for (const pipe of pipesRef.current) {
        const gapTop = pipe.gapY - PIPE_GAP / 2
        const gapBottom = pipe.gapY + PIPE_GAP / 2
        ctx.fillStyle = "#84cc16"
        ctx.strokeStyle = "#365314"
        ctx.lineWidth = 3
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, gapTop)
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, gapTop)
        ctx.fillRect(pipe.x, gapBottom, PIPE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT - gapBottom)
        ctx.strokeRect(pipe.x, gapBottom, PIPE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT - gapBottom)
      }

      ctx.fillStyle = "#a16207"
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)
      ctx.fillStyle = "#65a30d"
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 6)

      const img = rivetImgRef.current
      ctx.save()
      ctx.translate(RIVET_X, rivetYRef.current)
      const tilt = Math.max(-0.5, Math.min(0.9, velocityRef.current / 10))
      ctx.rotate(tilt)
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -RIVET_SIZE / 2, -RIVET_SIZE / 2, RIVET_SIZE, RIVET_SIZE)
      } else {
        ctx.fillStyle = "#22c55e"
        ctx.beginPath()
        ctx.arc(0, 0, RIVET_SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(update)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [highScore, setState])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative select-none overflow-hidden rounded-lg border border-border shadow-sm"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        onPointerDown={(e) => {
          e.preventDefault()
          flap()
        }}
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block touch-none" />

        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/40 px-2 py-1 text-xs font-semibold text-white">
          Best: {highScore}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-2xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {score}
        </div>

        {gameState !== "ready" && (
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto absolute right-2 top-2 h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              togglePause()
            }}
            aria-label={gameState === "paused" ? "Resume" : "Pause"}
          >
            {gameState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}

        {gameState === "ready" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 text-center text-white">
            <p className="text-lg font-bold">Flappy Rivet</p>
            <p className="text-sm">Tap, click, or press Space to flap</p>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-center text-white">
            <p className="text-lg font-bold">Paused</p>
            <Button
              size="sm"
              className="pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                togglePause()
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-center text-white">
            <p className="text-lg font-bold">Game Over</p>
            <p className="text-sm">Score: {score} · Best: {highScore}</p>
            <Button
              size="sm"
              className="pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                flap()
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tap/click the game, press Space/Up to flap, and P to pause.
      </p>
    </div>
  )
}
