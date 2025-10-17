import { useState } from 'react'
import { OptimizedLoopPoints } from '../types/audio.types'
import { createLoopableSegment, createExtendedLoop } from '../utils/crossfade'
import { exportAsWAV } from '../utils/exportAudio'

interface ExportOptionsProps {
  audioBuffer: AudioBuffer
  optimizedPoints: OptimizedLoopPoints
  fileName: string
}

export default function ExportOptions({
  audioBuffer,
  optimizedPoints,
  fileName
}: ExportOptionsProps) {
  const [exportMode, setExportMode] = useState<'single' | 'extended'>('single')
  const [extendedDuration, setExtendedDuration] = useState(10) // minutes
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))

      const loopBuffer = createLoopableSegment(audioBuffer, optimizedPoints)

      if (exportMode === 'single') {
        // Export single loopable segment
        const baseName = fileName.replace(/\.[^/.]+$/, '')
        exportAsWAV(loopBuffer, `${baseName}_loop.wav`)
      } else {
        // Export extended loop
        const targetDurationSeconds = extendedDuration * 60
        const extendedBuffer = createExtendedLoop(loopBuffer, targetDurationSeconds)
        const baseName = fileName.replace(/\.[^/.]+$/, '')
        exportAsWAV(extendedBuffer, `${baseName}_loop_${extendedDuration}min.wav`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export audio. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const loopDuration = optimizedPoints.end - optimizedPoints.start

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <h2 className="text-lg font-semibold mb-4">Export Options</h2>

      <div className="space-y-4">
        {/* Export Mode Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Export Mode</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
              <input
                type="radio"
                name="exportMode"
                value="single"
                checked={exportMode === 'single'}
                onChange={(e) => setExportMode(e.target.value as 'single')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Single Loopable Segment</div>
                <div className="text-sm text-gray-400 mt-1">
                  Export just the optimized loop segment ({loopDuration.toFixed(2)}s).
                  Perfect for importing into DAWs or game engines.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
              <input
                type="radio"
                name="exportMode"
                value="extended"
                checked={exportMode === 'extended'}
                onChange={(e) => setExportMode(e.target.value as 'extended')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Extended Loop</div>
                <div className="text-sm text-gray-400 mt-1">
                  Generate a longer file by repeating the loop.
                  Great for ambient music or soundscapes.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Extended Duration Control */}
        {exportMode === 'extended' && (
          <div className="bg-gray-900 p-4 rounded-lg">
            <label htmlFor="duration" className="block text-sm font-medium mb-2">
              Duration: {extendedDuration} minutes
            </label>
            <input
              id="duration"
              type="range"
              min="1"
              max="60"
              step="1"
              value={extendedDuration}
              onChange={(e) => setExtendedDuration(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 min</span>
              <span>30 min</span>
              <span>60 min</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Will repeat the loop approximately{' '}
              {Math.ceil((extendedDuration * 60) / loopDuration)} times
            </div>
          </div>
        )}

        {/* Export Info */}
        <div className="bg-gray-900 p-4 rounded-lg text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Format:</span>
            <span>WAV (16-bit PCM)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Sample Rate:</span>
            <span>{audioBuffer.sampleRate}Hz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Channels:</span>
            <span>{audioBuffer.numberOfChannels}</span>
          </div>
          {exportMode === 'extended' && (
            <div className="flex justify-between">
              <span className="text-gray-400">Output Duration:</span>
              <span>{extendedDuration} minutes</span>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exportMode === 'single' ? 'Download Loop Segment' : 'Download Extended Loop'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
