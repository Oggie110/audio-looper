import { useState } from 'react'
import AudioUploader from './components/AudioUploader'
import WaveformViewer from './components/WaveformViewer'
import LoopControls from './components/LoopControls'
import ExportOptions from './components/ExportOptions'
import { LoopPoints, OptimizedLoopPoints } from './types/audio.types'

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [loopPoints, setLoopPoints] = useState<LoopPoints>({ start: 0, end: 0 })
  const [optimizedPoints, setOptimizedPoints] = useState<OptimizedLoopPoints | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleAudioLoaded = (buffer: AudioBuffer, name: string) => {
    setAudioBuffer(buffer)
    setFileName(name)
    // Set initial loop points to cover the middle 50% of the audio
    const duration = buffer.duration
    setLoopPoints({
      start: duration * 0.25,
      end: duration * 0.75
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Audio Looper</h1>
          <p className="text-gray-400">Create seamless loops from ambient audio files</p>
        </header>

        {!audioBuffer ? (
          <AudioUploader onAudioLoaded={handleAudioLoaded} />
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">File: {fileName}</p>
              <p className="text-sm text-gray-400">
                Duration: {audioBuffer.duration.toFixed(2)}s |
                Sample Rate: {audioBuffer.sampleRate}Hz |
                Channels: {audioBuffer.numberOfChannels}
              </p>
            </div>

            <WaveformViewer
              audioBuffer={audioBuffer}
              loopPoints={loopPoints}
              onLoopPointsChange={setLoopPoints}
              optimizedPoints={optimizedPoints}
            />

            <LoopControls
              audioBuffer={audioBuffer}
              loopPoints={loopPoints}
              optimizedPoints={optimizedPoints}
              isPlaying={isPlaying}
              onOptimizedPointsChange={setOptimizedPoints}
              onPlayStateChange={setIsPlaying}
            />

            {optimizedPoints && (
              <ExportOptions
                audioBuffer={audioBuffer}
                optimizedPoints={optimizedPoints}
                fileName={fileName}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
