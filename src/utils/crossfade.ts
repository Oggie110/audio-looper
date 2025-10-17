import { OptimizedLoopPoints } from '../types/audio.types'

const getFadeInGain = (progress: number, useHann: boolean) => {
  if (useHann) {
    return Math.sqrt(0.5 - 0.5 * Math.cos(Math.PI * progress))
  }

  return Math.sin((progress * Math.PI) / 2)
}

const getFadeOutGain = (progress: number, useHann: boolean) => {
  if (useHann) {
    return Math.sqrt(0.5 + 0.5 * Math.cos(Math.PI * progress))
  }

  return Math.cos((progress * Math.PI) / 2)
}

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
  const useHannFade = loopPoints.crossfadeDuration >= 0.075

  // Calculate the length of the output buffer
  const startSample = loopPoints.startSample
  const endSample = loopPoints.endSample
  const loopLength = endSample - startSample
  const stitchLength = Math.min(fadeLength, Math.floor(loopLength * 0.2))

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

    // Blend-in a short slice from the loop tail so the start already
    // contains upcoming waveform information
    for (let i = 0; i < stitchLength; i++) {
      const mixProgress = i / Math.max(1, stitchLength - 1)
      const blendAmount = 0.35 * (1 - mixProgress)
      const tailIndex = Math.max(startSample, endSample - stitchLength + i)
      outputData[i] =
        outputData[i] * (1 - blendAmount) + inputData[tailIndex] * blendAmount
    }

    // Apply crossfade at the beginning (fade in from end of loop)
    for (let i = 0; i < fadeLength; i++) {
      const progress = i / Math.max(1, fadeLength - 1)
      const fadeInGain = getFadeInGain(progress, useHannFade)
      const fadeOutGain = getFadeOutGain(progress, useHannFade)

      // Get the sample from the end of the loop
      const endLoopSample = inputData[endSample - fadeLength + i]
      const startLoopSample = outputData[i]

      // Apply crossfade
      outputData[i] = fadeInGain * startLoopSample + fadeOutGain * endLoopSample
    }

    // Apply crossfade at the end (fade out to beginning of loop)
    for (let i = 0; i < fadeLength; i++) {
      const progress = i / Math.max(1, fadeLength - 1)
      const fadeOutGain = getFadeOutGain(progress, useHannFade)
      const fadeInGain = getFadeInGain(progress, useHannFade)

      const currentSample = outputData[loopLength - fadeLength + i]
      const startLoopSample = inputData[startSample + i]

      outputData[loopLength - fadeLength + i] =
        fadeOutGain * currentSample + fadeInGain * startLoopSample
    }

    // Pre-blend the start material into the tail to soften the entry
    for (let i = 0; i < stitchLength; i++) {
      const mixProgress = i / Math.max(1, stitchLength - 1)
      const blendAmount = 0.35 * mixProgress
      const targetIndex = loopLength - stitchLength + i
      outputData[targetIndex] =
        outputData[targetIndex] * (1 - blendAmount) +
        inputData[startSample + i] * blendAmount
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
