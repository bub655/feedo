"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Trash2, Pencil } from "lucide-react"

interface Annotation {
  id: string
  data: string
  timestamp: string
  timeFormatted: string
}

interface AnnotationCanvasProps {
  isDrawing: boolean
  setIsDrawing: (isDrawing: boolean) => void
  onSave: (annotationData: string, annotationId?: string) => void
  onDelete?: (annotationId: string) => void
  selectedAnnotation: Annotation | null
  isPlaying: boolean
  onClearSelection: () => void
}

export default function AnnotationCanvas({
  isDrawing,
  setIsDrawing,
  onSave,
  onDelete,
  selectedAnnotation,
  isPlaying,
  onClearSelection
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  // Initialize canvas and load selected annotation if any
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match parent container
    const resizeCanvas = () => {
      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Only load annotation if there's a selected one
    if (selectedAnnotation) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = selectedAnnotation.data
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [selectedAnnotation, isPlaying])

  // Clear selected annotation when video starts playing
  useEffect(() => {
    if (isPlaying && selectedAnnotation) {
      onClearSelection()
    }
  }, [isPlaying, selectedAnnotation, onClearSelection])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.strokeStyle = "#ff0000"
      ctx.lineWidth = 3
      ctx.lineCap = "round"
    }

    setIsDrawingActive(true)
    setLastPos({ x, y })
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive || !isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 3
    ctx.moveTo(lastPos.x, lastPos.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastPos({ x, y })
  }

  const stopDrawing = () => {
    setIsDrawingActive(false)
  }

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current
    if (!canvas) return true

    const ctx = canvas.getContext("2d")
    if (!ctx) return true

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return !imageData.some(channel => channel !== 0)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isCanvasEmpty()) {
      // If canvas is empty and we have a selected annotation, delete it
      if (selectedAnnotation) {
        onDelete?.(selectedAnnotation.id)
        onClearSelection()
      }
      return
    }

    const annotationData = canvas.toDataURL()
    // Pass the selected annotation ID if we're updating an existing one
    onSave(annotationData, selectedAnnotation?.id)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 z-20 pointer-events-none ${isPlaying && !selectedAnnotation ? 'opacity-0' : 'opacity-100'}`}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDrawing ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsDrawing(!isDrawing)}
          className={`${isDrawing ? "bg-primary text-primary-foreground" : "bg-black/50 hover:bg-black/70"} text-white`}
        >
          <Pencil className="h-5 w-5" />
        </Button>

        {isDrawing && (
          <>
            <Button variant="secondary" size="icon" onClick={handleClear} className="bg-black/50 hover:bg-black/70 text-white">
              <Trash2 className="h-5 w-5" />
            </Button>

            <Button variant="secondary" size="icon" onClick={handleSave} className="bg-black/50 hover:bg-black/70 text-white">
              <Save className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 