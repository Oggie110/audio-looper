import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'
import { LoopPoints, OptimizedLoopPoints } from '../types/audio.types'

interface WaveformViewerProps {
  audioBuffer: AudioBuffer
  loopPoints: LoopPoints
  onLoopPointsChange: (points: LoopPoints) => void
  optimizedPoints: OptimizedLoopPoints | null
}

export default function WaveformViewer({
  audioBuffer,
  loopPoints,
  onLoopPointsChange,
  optimizedPoints
}: WaveformViewerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsPluginRef = useRef<RegionsPlugin | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!waveformRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4F46E5',
      progressColor: '#818CF8',
      cursorColor: '#C7D2FE',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 150,
      barGap: 3,
    })

    // Initialize Regions plugin
    const regions = wavesurfer.registerPlugin(RegionsPlugin.create())

    wavesurferRef.current = wavesurfer
    regionsPluginRef.current = regions

    // Load the audio buffer
    wavesurfer.loadBlob(audioBufferToBlob(audioBuffer))

    wavesurfer.on('ready', () => {
      setIsReady(true)

      // Create initial loop region
      regions.addRegion({
        start: loopPoints.start,
        end: loopPoints.end,
        color: 'rgba(59, 130, 246, 0.3)',
        drag: true,
        resize: true,
      })
    })

    // Listen for region updates
    regions.on('region-updated', (region) => {
      onLoopPointsChange({
        start: region.start,
        end: region.end,
      })
    })

    return () => {
      wavesurfer.destroy()
    }
  }, [audioBuffer])

  // Update region when loop points change externally
  useEffect(() => {
    if (!isReady || !regionsPluginRef.current) return

    const regions = regionsPluginRef.current.getRegions()
    if (regions.length > 0) {
      const region = regions[0]
      region.setOptions({
        start: loopPoints.start,
        end: loopPoints.end,
      })
    }
  }, [loopPoints, isReady])

  // Show optimized points as a different visual indicator
  useEffect(() => {
    if (!isReady || !regionsPluginRef.current || !optimizedPoints) return

    // Clear any existing optimized region
    const regions = regionsPluginRef.current.getRegions()
    regions.forEach((region, index) => {
      if (index > 0) region.remove()
    })

    // Add optimized region visualization
    regionsPluginRef.current.addRegion({
      start: optimizedPoints.start,
      end: optimizedPoints.end,
      color: 'rgba(34, 197, 94, 0.3)',
      drag: false,
      resize: false,
    })
  }, [optimizedPoints, isReady])

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Waveform</h2>
      <div ref={waveformRef} className="w-full" />
      {!isReady && (
        <div className="text-center text-gray-400 py-8">Loading waveform...</div>
      )}
      <div className="mt-4 text-sm text-gray-400">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 bg-opacity-30 border border-blue-500"></div>
            <span>Manual Selection</span>
          </div>
          {optimizedPoints && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 bg-opacity-30 border border-green-500"></div>
              <span>Optimized Loop</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to convert AudioBuffer to Blob
function audioBufferToBlob(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels
  const length = buffer.length * numberOfChannels * 2
  const arrayBuffer = new ArrayBuffer(44 + length)
  const view = new DataView(arrayBuffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 4, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length, true)

  // Write audio data
  const channels: Float32Array[] = []
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
