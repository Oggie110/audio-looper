# Audio Looper - Project Plan

## Project Overview
A web application for creating seamless loops from ambient audio files with intelligent loop optimization.

## Project Location
`/Volumes/New 4 TB/Dropbox/1_A_WORK/1_Projects/audio-looper`

## Core Workflow
1. **Upload** - User uploads an ambient audio file (WAV, MP3, etc.)
2. **Visualize** - Display waveform with time markers
3. **Select** - User roughly selects loop start/end points (drag markers)
4. **Optimize** - App intelligently adjusts selection for perfect looping:
   - Zero-crossing detection (eliminate clicks/pops)
   - Volume matching (RMS analysis)
   - Phase correlation (smooth transition)
   - Optional crossfade
5. **Preview** - Listen to the loop in real-time
6. **Export** - Two options:
   - **Option 1**: Download single loopable segment (trimmed audio)
   - **Option 2**: Generate extended loop (specify duration, e.g., "10 minutes")

## Tech Stack

### Frontend Framework
- **React 18** with **TypeScript**
- **Vite** for fast development and building

### Audio Processing
- **Web Audio API** (native browser API)
  - AudioContext for audio processing
  - AudioBuffer for audio data manipulation
  - GainNode for crossfading
- **wavesurfer.js** or **peaks.js** for waveform visualization

### UI/Styling
- **Tailwind CSS** for styling
- **Radix UI** or **Headless UI** for accessible components
- **React DnD** or custom hooks for draggable markers

### File Handling
- **File API** for uploads
- **Blob/ArrayBuffer** for audio processing
- **FileSaver.js** or native download for exports

## Project Structure
```
audio-looper/
├── plan.md                    # This file
├── README.md                  # User documentation
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── example-samples/       # Example ambient audio files
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── AudioUploader.tsx       # File upload component
│   │   ├── WaveformViewer.tsx      # Waveform display with markers
│   │   ├── LoopControls.tsx        # Playback controls
│   │   ├── ExportOptions.tsx       # Download options UI
│   │   └── LoopMarker.tsx          # Draggable loop point markers
│   ├── hooks/
│   │   ├── useAudioPlayer.ts       # Audio playback logic
│   │   ├── useLoopOptimizer.ts     # Loop optimization algorithms
│   │   └── useWaveform.ts          # Waveform data management
│   ├── utils/
│   │   ├── audioProcessing.ts      # Core audio algorithms
│   │   ├── zeroCrossing.ts         # Zero-crossing detection
│   │   ├── volumeMatching.ts       # RMS volume analysis
│   │   ├── crossfade.ts            # Crossfade application
│   │   └── exportAudio.ts          # Audio file generation
│   └── types/
│       └── audio.types.ts          # TypeScript interfaces
```

## Implementation Phases

### Phase 1: Foundation (Setup)
- [x] Project planning
- [ ] Initialize Vite + React + TypeScript
- [ ] Install dependencies
- [ ] Set up basic project structure
- [ ] Configure Tailwind CSS

### Phase 2: Audio Upload & Visualization
- [ ] Implement file upload component
- [ ] Decode audio files to AudioBuffer
- [ ] Generate waveform visualization
- [ ] Display audio metadata (duration, sample rate)

### Phase 3: Loop Selection
- [ ] Add draggable start/end markers on waveform
- [ ] Show selection duration
- [ ] Basic playback of selected region

### Phase 4: Loop Optimization Algorithms
- [ ] Zero-crossing detection algorithm
- [ ] RMS volume matching
- [ ] Phase correlation analysis
- [ ] Auto-adjust markers to optimal points
- [ ] Visual feedback (show before/after adjustment)

### Phase 5: Crossfade & Polish
- [ ] Implement crossfade algorithm
- [ ] Adjustable crossfade length (50-500ms)
- [ ] Preview with crossfade applied

### Phase 6: Playback
- [ ] Implement looping playback
- [ ] Play/pause controls
- [ ] Visual playhead indicator
- [ ] Waveform zoom/scroll

### Phase 7: Export Options
- [ ] **Option 1**: Export single loopable segment
  - Trim audio to selected region
  - Apply crossfade preparation
  - Download as WAV/MP3
- [ ] **Option 2**: Generate extended loop
  - UI for duration input (minutes/seconds)
  - Repeat loop to fill duration
  - Apply crossfades between repetitions
  - Download as WAV/MP3

### Phase 8: UI/UX Polish
- [ ] Responsive design
- [ ] Keyboard shortcuts
- [ ] Loading states
- [ ] Error handling
- [ ] Tooltips and help text

### Phase 9: Testing & Optimization
- [ ] Test with various audio formats
- [ ] Performance optimization for large files
- [ ] Browser compatibility testing
- [ ] User testing with real ambient files

## Key Algorithms

### 1. Zero-Crossing Detection
```typescript
function findNearestZeroCrossing(
  audioData: Float32Array,
  targetSample: number,
  searchRadius: number = 1000
): number {
  // Search within radius for sign change
  // Return sample index closest to zero
}
```

### 2. RMS Volume Matching
```typescript
function calculateRMS(
  audioData: Float32Array,
  startSample: number,
  windowSize: number = 2048
): number {
  // Calculate root mean square of audio window
  // Return average volume level
}
```

### 3. Phase Correlation
```typescript
function findBestPhaseMatch(
  audioData: Float32Array,
  loopStart: number,
  loopEnd: number,
  searchWindow: number = 5000
): { start: number, end: number } {
  // Use cross-correlation to find best matching points
  // Return optimized loop points
}
```

### 4. Crossfade Application
```typescript
function applyCrossfade(
  audioBuffer: AudioBuffer,
  fadeLength: number = 0.1 // seconds
): AudioBuffer {
  // Apply equal-power crossfade at loop boundary
  // Return processed buffer
}
```

## Dependencies to Install
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wavesurfer.js": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Future Enhancements (v2)
- Multiple loop points (A/B comparison)
- Spectral analysis visualization
- Auto-detection of natural loop points
- Layer multiple loops
- Real-time effects (reverb, EQ)
- Save/load projects
- Batch processing
- Cloud storage integration

## Success Criteria
- [ ] Can upload common audio formats (WAV, MP3, OGG)
- [ ] Waveform clearly shows audio content
- [ ] Markers are smooth and responsive to drag
- [ ] Loop optimization produces seamless loops (no audible clicks)
- [ ] Export generates valid audio files
- [ ] Works on Chrome, Firefox, Safari
- [ ] Intuitive UI requiring minimal explanation

## Notes
- Web Audio API sample rate: 44100 Hz or 48000 Hz (browser dependent)
- Maximum file size: Consider memory limits (~100 MB reasonable for web)
- Audio format support depends on browser codec support
- Processing happens entirely client-side (no server needed)
