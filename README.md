# Audio Looper

A web application for creating seamless loops from ambient audio files with intelligent loop optimization.

## Features

- **Audio Upload**: Support for WAV, MP3, OGG, and other common audio formats
- **Waveform Visualization**: Interactive waveform display with draggable loop markers
- **Smart Loop Optimization**: Automatically adjusts loop points using:
  - Zero-crossing detection (eliminates clicks/pops)
  - Volume matching (RMS analysis)
  - Phase correlation (smooth transitions)
  - Crossfade application
- **Preview Playback**: Listen to your loop in real-time before exporting
- **Dual Export Modes**:
  1. **Single Loopable Segment**: Export just the optimized loop segment
  2. **Extended Loop**: Generate a longer file by repeating the loop (1-60 minutes)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (usually http://localhost:5173)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use

1. **Upload** an ambient audio file (drag & drop or click to browse)
2. **Adjust** the blue loop markers on the waveform to roughly select your desired loop region
3. **Configure** the crossfade duration (50-500ms recommended)
4. **Click "Optimize Loop Points"** to let the algorithm find the best loop boundaries
5. **Preview** your loop using the play button to ensure it sounds seamless
6. **Choose export mode**:
   - **Single Loopable Segment**: For importing into DAWs or game engines
   - **Extended Loop**: For creating longer ambient soundscapes
7. **Download** your optimized loop!

## Technical Details

### Loop Optimization Algorithm

The app uses a multi-step optimization process:

1. **Zero-Crossing Detection**: Finds points where the audio waveform crosses zero amplitude, preventing clicks
2. **Volume Matching**: Analyzes RMS levels to ensure similar volumes at loop start/end
3. **Phase Correlation**: Uses cross-correlation to find phase-aligned points for smooth transitions
4. **Crossfade**: Applies equal-power crossfade at loop boundaries

### Export Formats

- Format: WAV (16-bit PCM)
- Sample Rate: Preserved from original file
- Channels: Preserved from original file

## Browser Compatibility

Works best in modern browsers with Web Audio API support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
audio-looper/
├── src/
│   ├── components/       # React components
│   ├── utils/           # Audio processing utilities
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── plan.md              # Detailed project plan
└── README.md            # This file
```

## License

ISC

## Contributing

This is a personal project, but suggestions and improvements are welcome!
