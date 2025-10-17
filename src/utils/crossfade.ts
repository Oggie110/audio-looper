import { OptimizedLoopPoints } from '../types/audio.types'

const EPSILON = 1e-6

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

const removeDCOffsetInPlace = (data: Float32Array) => {
  let sum = 0

  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }

  const mean = sum / Math.max(1, data.length)

  if (Math.abs(mean) < EPSILON) {
    return
  }

  for (let i = 0; i < data.length; i++) {
    data[i] -= mean
  }
}

const getSegmentMean = (
  data: Float32Array,
  start: number,
  length: number
): number => {
  const clampedStart = Math.max(0, Math.min(start, data.length - 1))
  const clampedEnd = Math.min(clampedStart + length, data.length)

  let sum = 0

  for (let i = clampedStart; i < clampedEnd; i++) {
    sum += data[i]
  }

  return sum / Math.max(1, clampedEnd - clampedStart)
}

const getAverageSlope = (
  data: Float32Array,
  start: number,
  length: number
): number => {
  const window = Math.max(2, Math.min(length, data.length - start))
  let sum = 0

  for (let i = 0; i < window - 1; i++) {
    const idx = start + i
    sum += data[idx + 1] - data[idx]
  }

  return sum / Math.max(1, window - 1)
}

const smoothLoopSeam = (data: Float32Array) => {
  const seamWindow = Math.min(2048, Math.floor(data.length * 0.1))

  if (seamWindow < 4) {
    return
  }

  const tailStart = data.length - seamWindow
  const startMean = getSegmentMean(data, 0, seamWindow)
  const endMean = getSegmentMean(data, tailStart, seamWindow)
  const meanOffset = endMean - startMean

  for (let i = 0; i < seamWindow; i++) {
    const progress = (i + 1) / seamWindow
    const idx = tailStart + i
    data[idx] -= meanOffset * progress
  }

  const startSlope = getAverageSlope(data, 0, seamWindow)
  const endSlope = getAverageSlope(data, tailStart, seamWindow)
  const slopeOffset = endSlope - startSlope

  for (let i = 0; i < seamWindow; i++) {
    const progress = (i + 1) / seamWindow
    const idx = tailStart + i
    data[idx] -= slopeOffset * progress * seamWindow * 0.5
  }

  for (let pass = 0; pass < 2; pass++) {
    let previous = data[tailStart]

    for (let i = 1; i < seamWindow - 1; i++) {
      const idx = tailStart + i
      const current = data[idx]
      const next = data[idx + 1]
      data[idx] = current * 0.5 + (previous + next) * 0.25
      previous = current
    }
  }
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

    removeDCOffsetInPlace(outputData)
    smoothLoopSeam(outputData)
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
