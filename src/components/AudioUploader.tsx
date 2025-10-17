import { useRef, useState } from 'react'

interface AudioUploaderProps {
  onAudioLoaded: (buffer: AudioBuffer, fileName: string) => void
}

export default function AudioUploader({ onAudioLoaded }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      onAudioLoaded(audioBuffer, file.name)
    } catch (err) {
      setError('Failed to load audio file. Please try a different file.')
      console.error('Audio loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>

        <h3 className="text-lg font-medium mb-2">Upload an audio file</h3>
        <p className="text-sm text-gray-400 mb-6">
          Supports WAV, MP3, OGG, and other common formats
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Loading...' : 'Choose File'}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
