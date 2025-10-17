import { OptimizedLoopPoints } from '../types/audio.types'

/**
 * Apply an equal-power crossfade to create a seamless loop segment
 * @param audioBuffer Original audio buffer
 * @param loopPoints Optimized loop points with crossfade duration
 * @returns New audio buffer with crossfade applied
 */
export function applyCrossfade(
  audioBuffer: AudioBuffer,
  loopPoints: OptimizedLoopPoints
): AudioBuffer {
  const sampleRate = audioBuffer.sampleRate
  const numberOfChannels = audioBuffer.numberOfChannels
  const fadeLength = Math.floor(loopPoints.crossfadeDuration * sampleRate)

  // Calculate the length of the output buffer
  const startSample = loopPoints.startSample
  const endSample = loopPoints.endSample
  const loopLength = endSample - startSample

  // Create new audio buffer
  const audioContext = new AudioContext()
  const newBuffer = audioContext.createBuffer(
    numberOfChannels,
    loopLength,
    sampleRate
  )

  // Process each channel
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel)
    const outputData = newBuffer.getChannelData(channel)

    // Copy the main loop segment
    for (let i = 0; i < loopLength; i++) {
      outputData[i] = inputData[startSample + i]
    }

    // Apply crossfade at the beginning (fade in from end of loop)
    for (let i = 0; i < fadeLength; i++) {
      const fadeInGain = Math.sqrt(i / fadeLength) // Equal-power fade in
      const fadeOutGain = Math.sqrt(1 - (i / fadeLength)) // Equal-power fade out

      // Get the sample from the end of the loop
      const endLoopSample = inputData[endSample - fadeLength + i]
      const startLoopSample = outputData[i]

      // Apply crossfade
      outputData[i] = fadeInGain * startLoopSample + fadeOutGain * endLoopSample
    }

    // Apply crossfade at the end (fade out to beginning of loop)
    for (let i = 0; i < fadeLength; i++) {
      const fadeOutGain = Math.sqrt(1 - (i / fadeLength)) // Equal-power fade out
      const fadeInGain = Math.sqrt(i / fadeLength) // Equal-power fade in

      const currentSample = outputData[loopLength - fadeLength + i]
      const startLoopSample = inputData[startSample + i]

      outputData[loopLength - fadeLength + i] =
        fadeOutGain * currentSample + fadeInGain * startLoopSample
    }
  }

  return newBuffer
}

/**
 * Create an extended loop by repeating the loop segment
 * @param loopBuffer The single loopable segment (with crossfade)
 * @param targetDuration Desired duration in seconds
 * @returns New audio buffer with extended loop
 */
export function createExtendedLoop(
  loopBuffer: AudioBuffer,
  targetDuration: number
): AudioBuffer {
  const sampleRate = loopBuffer.sampleRate
  const numberOfChannels = loopBuffer.numberOfChannels
  const loopLength = loopBuffer.length

  // Calculate total samples for target duration
  const totalSamples = Math.floor(targetDuration * sampleRate)

  // Create new audio buffer
  const audioContext = new AudioContext()
  const extendedBuffer = audioContext.createBuffer(
    numberOfChannels,
    totalSamples,
    sampleRate
  )

  // Process each channel
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const loopData = loopBuffer.getChannelData(channel)
    const outputData = extendedBuffer.getChannelData(channel)

    // Copy the loop multiple times
    for (let i = 0; i < totalSamples; i++) {
      const loopPosition = i % loopLength
      outputData[i] = loopData[loopPosition]
    }
  }

  return extendedBuffer
}

/**
 * Create a loopable segment without extending it
 * This prepares the audio for seamless looping by applying crossfade
 */
export function createLoopableSegment(
  audioBuffer: AudioBuffer,
  loopPoints: OptimizedLoopPoints
): AudioBuffer {
  return applyCrossfade(audioBuffer, loopPoints)
}
