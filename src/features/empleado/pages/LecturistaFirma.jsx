import React, { useEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'
export default function SignaturePad({ value, onChange, disabled = false }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const emptyRef = useRef(true)

  const prepareCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2.5
    context.strokeStyle = '#111827'

    if (value) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
      image.src = value
      emptyRef.current = false
    } else {
      context.clearRect(0, 0, rect.width, rect.height)
      emptyRef.current = true
    }
  }

  useEffect(() => {
    prepareCanvas()
    window.addEventListener('resize', prepareCanvas)
    return () => window.removeEventListener('resize', prepareCanvas)
  }, [value])

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startDrawing = (event) => {
    if (disabled) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const point = pointFromEvent(event)

    drawingRef.current = true
    context.beginPath()
    context.moveTo(point.x, point.y)
    canvas.setPointerCapture?.(event.pointerId)
  }

  const draw = (event) => {
    if (disabled || !drawingRef.current) return
    const context = canvasRef.current.getContext('2d')
    const point = pointFromEvent(event)

    context.lineTo(point.x, point.y)
    context.stroke()
    emptyRef.current = false
  }

  const stopDrawing = () => {
    if (disabled || !drawingRef.current) return
    drawingRef.current = false
    onChange(emptyRef.current ? '' : canvasRef.current.toDataURL('image/png'))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    context.clearRect(0, 0, rect.width, rect.height)
    emptyRef.current = true
    onChange('')
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className={`h-44 w-full rounded-md bg-white ${disabled ? 'cursor-not-allowed opacity-75' : 'touch-none cursor-crosshair'}`}
        />
      </div>
      <button
        type="button"
        onClick={clearSignature}
        disabled={disabled || !value}
        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Eraser className="mr-2 h-4 w-4" />
        Limpiar firma
      </button>
    </div>
  )
}

