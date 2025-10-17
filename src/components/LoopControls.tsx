import { useState, useRef, useEffect } from 'react'
import { LoopPoints, OptimizedLoopPoints } from '../types/audio.types'
import { optimizeLoopPoints } from '../utils/audioProcessing'

interface LoopControlsProps {
  audioBuffer: AudioBuffer
  loopPoints: LoopPoints
  optimizedPoints: OptimizedLoopPoints | null
  isPlaying: boolean
  onOptimizedPointsChange: (points: OptimizedLoopPoints) => void
  onPlayStateChange: (isPlaying: boolean) => void
}

export default function LoopControls({
  audioBuffer,
  loopPoints,
  optimizedPoints,
  isPlaying,
  onOptimizedPointsChange,
  onPlayStateChange
}: LoopControlsProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [crossfadeDuration, setCrossfadeDuration] = useState(0.05) // 50ms default
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext()

    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
      }
      audioContextRef.current?.close()
    }
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      // Run optimization in a setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100))

      const optimized = optimizeLoopPoints(
        audioBuffer,
        loopPoints,
        crossfadeDuration
      )

      onOptimizedPointsChange(optimized)
    } catch (error) {
      console.error('Optimization error:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handlePlayLoop = () => {
    if (!audioContextRef.current || !optimizedPoints) return

    if (isPlaying) {
      // Stop playback
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
        sourceNodeRef.current = null
      }
      onPlayStateChange(false)
    } else {
      // Start playback
      const ctx = audioContextRef.current
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.loop = true
      source.loopStart = optimizedPoints.start
      source.loopEnd = optimizedPoints.end

      source.onended = () => {
        onPlayStateChange(false)
      }

      source.start(0, optimizedPoints.start)
      sourceNodeRef.current = source
      onPlayStateChange(true)
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <h2 className="text-lg font-semibold mb-4">Loop Controls</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Manual Loop Points
          </label>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <span className="text-gray-400">Start:</span>{' '}
              {loopPoints.start.toFixed(3)}s
            </div>
            <div>
              <span className="text-gray-400">End:</span>{' '}
              {loopPoints.end.toFixed(3)}s
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Duration:</span>{' '}
              {(loopPoints.end - loopPoints.start).toFixed(3)}s
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="crossfade" className="block text-sm font-medium mb-2">
            Crossfade Duration: {(crossfadeDuration * 1000).toFixed(0)}ms
          </label>
          <input
            id="crossfade"
            type="range"
            min="10"
            max="500"
            step="10"
            value={crossfadeDuration * 1000}
            onChange={(e) => setCrossfadeDuration(Number(e.target.value) / 1000)}
            className="w-full"
          />
        </div>

        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Loop Points'}
        </button>

        {optimizedPoints && (
          <>
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm font-medium mb-2 text-green-400">
                Optimized Loop Points
              </label>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <span className="text-gray-400">Start:</span>{' '}
                  {optimizedPoints.start.toFixed(3)}s
                </div>
                <div>
                  <span className="text-gray-400">End:</span>{' '}
                  {optimizedPoints.end.toFixed(3)}s
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Duration:</span>{' '}
                  {(optimizedPoints.end - optimizedPoints.start).toFixed(3)}s
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  Adjusted by {Math.abs(optimizedPoints.start - loopPoints.start).toFixed(3)}s (start) and{' '}
                  {Math.abs(optimizedPoints.end - loopPoints.end).toFixed(3)}s (end)
                </div>
              </div>
            </div>

            <button
              onClick={handlePlayLoop}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Stop Preview
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Preview Loop
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
