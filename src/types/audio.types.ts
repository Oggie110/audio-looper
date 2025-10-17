export interface LoopPoints {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface OptimizedLoopPoints extends LoopPoints {
  startSample: number;
  endSample: number;
  crossfadeDuration: number; // in seconds
}

export interface AudioFileInfo {
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

export interface ExportOptions {
  format: 'wav' | 'mp3';
  mode: 'single' | 'extended';
  extendedDuration?: number; // in seconds, for extended mode
}
