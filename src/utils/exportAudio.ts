/**
 * Convert AudioBuffer to WAV file and trigger download
 */
export function exportAsWAV(audioBuffer: AudioBuffer, fileName: string): void {
  const wavBlob = audioBufferToWav(audioBuffer)
  downloadBlob(wavBlob, fileName)
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample

  const data = interleaveChannels(buffer)
  const dataLength = data.length * bytesPerSample
  const bufferLength = 44 + dataLength

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // Write WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // ByteRate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
    view.setInt16(offset, intSample, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Interleave channels for WAV format
 */
function interleaveChannels(buffer: AudioBuffer): Float32Array {
  const numberOfChannels = buffer.numberOfChannels
  const length = buffer.length * numberOfChannels

  const result = new Float32Array(length)
  const channels: Float32Array[] = []

  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  let index = 0
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      result[index++] = channels[channel][i]
    }
  }

  return result
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Trigger browser download of a Blob
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
