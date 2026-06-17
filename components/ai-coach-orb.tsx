"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  targetX?: number
  targetY?: number
  baseX: number
  baseY: number
}

interface AICoachOrbProps {
  size?: number
  particleCount?: number
  isActive?: boolean
}

export function AICoachOrb({ size = 600, particleCount = 2000, isActive = true }: AICoachOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()
  const morphStateRef = useRef<"random" | "morphing-to-logo" | "holding-logo" | "morphing-to-random">("random")
  const morphProgressRef = useRef(0)
  const stateTimerRef = useRef(0)
  const logoPointsRef = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35

    const generateLogoPoints = () => {
      const points: { x: number; y: number }[] = []

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = "/chessiro-logo.svg"

      const tempCanvas = document.createElement("canvas")
      const logoSize = 400
      tempCanvas.width = logoSize
      tempCanvas.height = logoSize
      const tempCtx = tempCanvas.getContext("2d")

      if (!tempCtx) return points

      img.onload = () => {
        tempCtx.clearRect(0, 0, logoSize, logoSize)

        // Draw logo centered on temp canvas
        const imgAspect = img.width / img.height
        let drawWidth = logoSize
        let drawHeight = logoSize

        if (imgAspect > 1) {
          drawHeight = logoSize / imgAspect
        } else {
          drawWidth = logoSize * imgAspect
        }

        const drawX = (logoSize - drawWidth) / 2
        const drawY = (logoSize - drawHeight) / 2

        tempCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        const imageData = tempCtx.getImageData(0, 0, logoSize, logoSize)
        const data = imageData.data

        const filledPoints: { x: number; y: number }[] = []
        const step = 2

        for (let y = 0; y < logoSize; y += step) {
          for (let x = 0; x < logoSize; x += step) {
            const idx = (y * logoSize + x) * 4
            const alpha = data[idx + 3]

            if (alpha > 128) {
              filledPoints.push({ x, y })
            }
          }
        }

        const minX = Math.min(...filledPoints.map((p) => p.x))
        const maxX = Math.max(...filledPoints.map((p) => p.x))
        const minY = Math.min(...filledPoints.map((p) => p.y))
        const maxY = Math.max(...filledPoints.map((p) => p.y))

        const logoWidth = maxX - minX
        const logoHeight = maxY - minY
        const logoCenterX = (minX + maxX) / 2
        const logoCenterY = (minY + maxY) / 2

        // Use the same scale for both dimensions to maintain aspect ratio
        const logoScale = (size * 0.6) / Math.max(logoWidth, logoHeight)

        for (let i = filledPoints.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[filledPoints[i], filledPoints[j]] = [filledPoints[j], filledPoints[i]]
        }

        const totalPoints = Math.min(filledPoints.length, particleCount)
        const skipFactor = Math.floor(filledPoints.length / totalPoints)

        for (let i = 0; i < totalPoints; i++) {
          const point = filledPoints[i * skipFactor]
          if (point) {
            const scaledX = (point.x - logoCenterX) * logoScale + centerX
            const scaledY = (point.y - logoCenterY) * logoScale + centerY
            points.push({ x: scaledX, y: scaledY })
          }
        }

        while (points.length < particleCount) {
          const randomPoint = filledPoints[Math.floor(Math.random() * filledPoints.length)]
          if (randomPoint) {
            const scaledX = (randomPoint.x - logoCenterX) * logoScale + centerX
            const scaledY = (randomPoint.y - logoCenterY) * logoScale + centerY
            points.push({ x: scaledX, y: scaledY })
          }
        }

        logoPointsRef.current = points

        particlesRef.current.forEach((particle, i) => {
          if (points[i]) {
            particle.targetX = points[i].x
            particle.targetY = points[i].y
          }
        })
      }

      return Array.from({ length: particleCount }, (_, i) => {
        const angle = (i / particleCount) * Math.PI * 2
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        }
      })
    }

    if (particlesRef.current.length === 0) {
      logoPointsRef.current = generateLogoPoints()

      particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * radius * 0.8
        const baseX = centerX + Math.cos(angle) * distance
        const baseY = centerY + Math.sin(angle) * distance

        return {
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: 1,
          opacity: 1,
          baseX,
          baseY,
          targetX: logoPointsRef.current[i]?.x || baseX,
          targetY: logoPointsRef.current[i]?.y || baseY,
        }
      })
    }

    const animate = () => {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return

      ctx.fillStyle = "#674E34"
      ctx.fillRect(0, 0, size, size)

      stateTimerRef.current++
      const fps = 60

      if (isActive) {
        // Active state: cycle through random → morphing-to-logo → holding-logo → morphing-to-random
        if (morphStateRef.current === "random" && stateTimerRef.current > fps * 3) {
          morphStateRef.current = "morphing-to-logo"
          morphProgressRef.current = 0
          stateTimerRef.current = 0
        } else if (morphStateRef.current === "morphing-to-logo") {
          morphProgressRef.current += 0.01 // 1 second
          if (morphProgressRef.current >= 1) {
            morphStateRef.current = "holding-logo"
            stateTimerRef.current = 0
          }
        } else if (morphStateRef.current === "holding-logo" && stateTimerRef.current > fps * 3) {
          morphStateRef.current = "morphing-to-random"
          morphProgressRef.current = 0
          stateTimerRef.current = 0
        } else if (morphStateRef.current === "morphing-to-random") {
          morphProgressRef.current += 0.01 // 1 second
          if (morphProgressRef.current >= 1) {
            morphStateRef.current = "random"
            morphProgressRef.current = 0
            stateTimerRef.current = 0
          }
        }
      } else {
        // Idle state: just hold the logo
        morphStateRef.current = "holding-logo"
        morphProgressRef.current = 1
      }

      particlesRef.current.forEach((particle, i) => {
        const progress =
          morphStateRef.current === "morphing-to-logo"
            ? morphProgressRef.current
            : morphStateRef.current === "morphing-to-random"
              ? 1 - morphProgressRef.current
              : morphStateRef.current === "holding-logo"
                ? 1
                : 0
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        const isMorphing = morphStateRef.current === "morphing-to-logo" || morphStateRef.current === "holding-logo"
        const isMorphingBack = morphStateRef.current === "morphing-to-random"

        if (isMorphing && particle.targetX !== undefined && particle.targetY !== undefined) {
          const targetX = particle.baseX + (particle.targetX - particle.baseX) * easeProgress
          const targetY = particle.baseY + (particle.targetY - particle.baseY) * easeProgress

          const dx = targetX - particle.x
          const dy = targetY - particle.y
          particle.vx += dx * 0.05
          particle.vy += dy * 0.05
        } else if (isMorphingBack && particle.targetX !== undefined && particle.targetY !== undefined) {
          const targetX = particle.targetX + (particle.baseX - particle.targetX) * easeProgress
          const targetY = particle.targetY + (particle.baseY - particle.targetY) * easeProgress

          const dx = targetX - particle.x
          const dy = targetY - particle.y
          particle.vx += dx * 0.05
          particle.vy += dy * 0.05
        } else {
          // Random motion state
          const dx = particle.x - centerX
          const dy = particle.y - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > radius) {
            const angle = Math.atan2(dy, dx)
            particle.x = centerX + Math.cos(angle) * radius
            particle.y = centerY + Math.sin(angle) * radius
            particle.vx *= -0.8
            particle.vy *= -0.8
          }

          const pullStrength = 0.003
          particle.vx -= dx * pullStrength
          particle.vy -= dy * pullStrength

          particle.vx += (Math.random() - 0.5) * 0.1
          particle.vy += (Math.random() - 0.5) * 0.1
        }

        particle.x += particle.vx * (isActive ? 1 : 0.3)
        particle.y += particle.vy * (isActive ? 1 : 0.3)

        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        const maxSpeed = progress < 1 ? 3 : 1.5
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed
          particle.vy = (particle.vy / speed) * maxSpeed
        }

        particle.vx *= 0.98
        particle.vy *= 0.98

        particle.opacity = 0.5 + Math.sin(Date.now() * 0.002 + particle.x) * 0.3

        ctx.shadowBlur = 6
        ctx.shadowColor = `rgba(243, 231, 219, ${particle.opacity * 0.5})`
        ctx.fillStyle = `rgba(243, 231, 219, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [size, particleCount, isActive])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="will-change-transform"
      style={{ width: size, height: size }}
    />
  )
}
