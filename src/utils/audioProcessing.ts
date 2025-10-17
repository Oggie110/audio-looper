import { LoopPoints, OptimizedLoopPoints } from '../types/audio.types'

const EPSILON = 1e-6

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const averageAbsoluteDerivative = (
  audioData: Float32Array,
  startSample: number,
  windowSize: number
): number => {
  const end = Math.min(startSample + windowSize, audioData.length - 1)
  let sum = 0

  for (let i = startSample; i < end; i++) {
    sum += Math.abs(audioData[i + 1] - audioData[i])
  }

  return sum / Math.max(1, end - startSample)
}

/**
 * Find the nearest zero-crossing point in the audio data
 * @param audioData Float32Array of audio samples
 * @param targetSample The sample index to search around
 * @param searchRadius Number of samples to search on each side
 * @returns The sample index of the nearest zero-crossing
 */
export function findNearestZeroCrossing(
  audioData: Float32Array,
  targetSample: number,
  searchRadius: number = 2000
): number {
  let bestSample = targetSample
  let bestScore = Infinity

  const start = Math.max(0, targetSample - searchRadius)
  const end = Math.min(audioData.length - 1, targetSample + searchRadius)

  const referenceWindow = Math.min(1024, Math.floor(searchRadius / 2))
  const referenceWindowStart = clamp(
    targetSample - Math.floor(referenceWindow / 2),
    0,
    audioData.length - referenceWindow
  )
  const referenceRMS = calculateRMS(
    audioData,
    referenceWindowStart,
    referenceWindow
  )
  const referenceSlope =
    audioData[Math.min(targetSample + 1, audioData.length - 1)] -
    audioData[Math.max(targetSample - 1, 0)]

  for (let i = start; i < end - 1; i++) {
    const current = audioData[i]
    const next = audioData[i + 1]

    // Check for zero-crossing (sign change)
    if ((current <= 0 && next >= 0) || (current >= 0 && next <= 0)) {
      // Calculate how close this crossing is to zero
      const crossingValue = Math.abs(current) + Math.abs(next)
      const distanceFromTarget = Math.abs(i - targetSample)
      const slope = next - current
      const slopeDiff = Math.abs(slope - referenceSlope)

      const localRMS = calculateRMS(
        audioData,
        clamp(i - Math.floor(referenceWindow / 2), 0, audioData.length - referenceWindow),
        referenceWindow
      )
      const rmsDiff = Math.abs(referenceRMS - localRMS) / (referenceRMS + EPSILON)

      // Weighted score: favor low amplitude at the crossing, RMS similarity and proximity
      const score =
        crossingValue * 0.35 +
        (distanceFromTarget / (searchRadius + EPSILON)) * 0.25 +
        clamp(rmsDiff, 0, 2) * 0.25 +
        slopeDiff * 0.15

      if (score < bestScore) {
        bestScore = score
        bestSample = i
      }
    }
  }

  return bestSample
}

/**
 * Calculate RMS (Root Mean Square) volume for a window of audio
 * @param audioData Float32Array of audio samples
 * @param startSample Starting sample index
 * @param windowSize Number of samples to analyze
 * @returns RMS value (0.0 to 1.0)
 */
export function calculateRMS(
  audioData: Float32Array,
  startSample: number,
  windowSize: number = 2048
): number {
  const end = Math.min(startSample + windowSize, audioData.length)
  let sum = 0

  for (let i = startSample; i < end; i++) {
    sum += audioData[i] * audioData[i]
  }

  return Math.sqrt(sum / (end - startSample))
}

/**
 * Find the best loop points using volume matching
 * @param audioData Float32Array of audio samples
 * @param startSample Initial start sample
 * @param endSample Initial end sample
 * @param searchRadius Radius to search for better matches
 * @returns Optimized start and end sample indices
 */
export function findVolumeMatchedPoints(
  audioData: Float32Array,
  startSample: number,
  endSample: number,
  searchRadius: number = 5000
): { start: number; end: number } {
  const startRMS = calculateRMS(audioData, startSample)
  let bestEndSample = endSample
  let minRMSDiff = Infinity

  const searchStart = Math.max(startSample + 1000, endSample - searchRadius)
  const searchEnd = Math.min(audioData.length - 1000, endSample + searchRadius)

  for (let i = searchStart; i < searchEnd; i += 100) {
    const endRMS = calculateRMS(audioData, i)
    const rmsDiff = Math.abs(startRMS - endRMS)

    if (rmsDiff < minRMSDiff) {
      minRMSDiff = rmsDiff
      bestEndSample = i
    }
  }

  return { start: startSample, end: bestEndSample }
}

/**
 * Calculate cross-correlation between two audio segments
 * Used to find phase-matched loop points
 */
export function crossCorrelation(
  audioData: Float32Array,
  start1: number,
  start2: number,
  windowSize: number = 1024
): number {
  let correlation = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < windowSize; i++) {
    const idx1 = start1 + i
    const idx2 = start2 + i

    if (idx1 >= audioData.length || idx2 >= audioData.length) break

    const val1 = audioData[idx1]
    const val2 = audioData[idx2]

    correlation += val1 * val2
    norm1 += val1 * val1
    norm2 += val2 * val2
  }

  return correlation / Math.sqrt(norm1 * norm2)
}

/**
 * Find the best phase-matched loop point
 */
export function findPhaseMatchedPoint(
  audioData: Float32Array,
  startSample: number,
  endSample: number,
  searchRadius: number = 3000
): number {
  let bestEndSample = endSample
  let maxCorrelation = -Infinity

  const searchStart = Math.max(startSample + 1000, endSample - searchRadius)
  const searchEnd = Math.min(audioData.length - 1024, endSample + searchRadius)

  for (let i = searchStart; i < searchEnd; i += 50) {
    const correlation = crossCorrelation(audioData, startSample, i, 1024)

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation
      bestEndSample = i
    }
  }

  return bestEndSample
}

/**
 * Determine an adaptive crossfade duration based on loop content
 */
export function getAdaptiveCrossfadeDuration(
  audioData: Float32Array,
  startSample: number,
  endSample: number,
  sampleRate: number,
  requestedDuration: number
): number {
  const loopSamples = Math.max(1, endSample - startSample)
  const loopDuration = loopSamples / sampleRate

  const analysisWindow = Math.min(4096, Math.floor(loopSamples / 2))
  const startRMS = calculateRMS(audioData, startSample, analysisWindow)
  const endRMS = calculateRMS(
    audioData,
    Math.max(startSample, endSample - analysisWindow),
    analysisWindow
  )

  const derivativeWindow = Math.min(2048, analysisWindow)
  const startDerivative = averageAbsoluteDerivative(
    audioData,
    startSample,
    derivativeWindow
  )
  const endDerivative = averageAbsoluteDerivative(
    audioData,
    Math.max(startSample, endSample - derivativeWindow - 1),
    derivativeWindow
  )

  const rmsDiff = Math.abs(startRMS - endRMS) / (Math.max(startRMS, EPSILON))
  const dynamicScore = clamp(
    Math.max(startDerivative, endDerivative) / 0.5,
    0,
    1
  )

  const energyScore = clamp(rmsDiff, 0, 1)

  const baseDuration = clamp(requestedDuration, 0.015, 0.2)
  let adaptiveDuration =
    baseDuration + energyScore * 0.03 + dynamicScore * 0.04

  // Penalize for very short loops
  if (loopDuration < 0.4) {
    adaptiveDuration *= clamp(loopDuration / 0.4, 0.3, 1)
  }

  const minDuration = Math.min(0.015, loopDuration * 0.2)
  const maxDuration = Math.min(0.15, loopDuration * 0.45)

  return clamp(adaptiveDuration, Math.max(0.01, minDuration), Math.max(minDuration, maxDuration))
}

/**
 * Main optimization function that combines all techniques
 */
export function optimizeLoopPoints(
  audioBuffer: AudioBuffer,
  loopPoints: LoopPoints,
  crossfadeDuration: number = 0.05 // 50ms default
): OptimizedLoopPoints {
  const sampleRate = audioBuffer.sampleRate
  const analysisSource = audioBuffer.getChannelData(0) // Use first channel
  const audioData = removeDCOffset(analysisSource)

  // Convert time to samples
  let startSample = Math.floor(loopPoints.start * sampleRate)
  let endSample = Math.floor(loopPoints.end * sampleRate)

  // Step 1: Find zero-crossings
  console.log('Finding zero-crossings...')
  startSample = findNearestZeroCrossing(audioData, startSample)
  endSample = findNearestZeroCrossing(audioData, endSample)

  // Step 2: Volume matching
  console.log('Matching volumes...')
  const volumeMatched = findVolumeMatchedPoints(audioData, startSample, endSample)
  endSample = volumeMatched.end

  // Step 3: Fine-tune with zero-crossing again
  endSample = findNearestZeroCrossing(audioData, endSample, 500)

  // Step 4: Phase matching (optional, can be computationally intensive)
  console.log('Phase matching...')
  endSample = findPhaseMatchedPoint(audioData, startSample, endSample, 2000)
  endSample = findNearestZeroCrossing(audioData, endSample, 200)

  const crossfadeDurationSeconds = getAdaptiveCrossfadeDuration(
    audioData,
    startSample,
    endSample,
    sampleRate,
    crossfadeDuration
  )

  // Convert back to time
  const optimizedStart = startSample / sampleRate
  const optimizedEnd = endSample / sampleRate

  console.log('Optimization complete:', {
    original: loopPoints,
    optimized: { start: optimizedStart, end: optimizedEnd },
    sampleShift: {
      start: startSample - Math.floor(loopPoints.start * sampleRate),
      end: endSample - Math.floor(loopPoints.end * sampleRate)
    }
  })

  return {
    start: optimizedStart,
    end: optimizedEnd,
    startSample,
    endSample,
    crossfadeDuration: crossfadeDurationSeconds
  }
}
