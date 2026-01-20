import { Audio } from "expo-av";
import FFT from "fft.js";

// helper: find mode of an array
function mode(values: number[]): number {
  const counts = new Map<number, number>();
  let best = values[0];
  let bestCount = 0;

  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

// helper: convert magnitude to dB
function magToDb(mag: number) {
  return 20 * Math.log10(mag + 1e-8);
}

export function useFrequencyListener() {
  const FFT_SIZE = 8192;
  const SAMPLE_RATE = 44100;
  const MIN_F = 18300;
  const MAX_F = 21100;

  const fft = new FFT(FFT_SIZE);
  const spectrum = fft.createComplexArray();

  // The main function
  async function listenFrequencies(): Promise<number> {
    const granted = await Audio.requestPermissionsAsync();
    if (!granted) return 0;
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    // record 200ms
    await new Promise((resolve) => setTimeout(resolve, 200));

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (!uri) return 0;

    // read file and decode PCM
    const pcm = decodeURI(uri); // Float32Array of samples

    console.log(pcm);

    if (pcm.length < FFT_SIZE) return 0;

    // take first FFT_SIZE samples
    const input = pcm.substring(0, FFT_SIZE);

    // FFT
    fft.realTransform(spectrum, input);
    fft.completeSpectrum(spectrum);

    const nyquist = SAMPLE_RATE / 2;
    const binCount = FFT_SIZE / 2;

    let maxDb = -Infinity;
    let max2Db = -Infinity;
    let maxIndex = -1;
    let max2Index = -1;

    for (let i = 0; i < binCount; i++) {
      const freq = (i * nyquist) / binCount;
      if (freq < MIN_F || freq > MAX_F) continue;

      const re = spectrum[2 * i];
      const im = spectrum[2 * i + 1];
      const mag = Math.hypot(re, im);
      const db = magToDb(mag);

      const f1 = maxIndex >= 0 ? (maxIndex * nyquist) / binCount : 0;
      const f2 = max2Index >= 0 ? (max2Index * nyquist) / binCount : 0;

      if (Math.abs(freq - f1) > 100 && db > maxDb) {
        max2Db = maxDb;
        max2Index = maxIndex;
        maxDb = db;
        maxIndex = i;
      } else if (Math.abs(freq - f2) > 100 && db > max2Db) {
        max2Db = db;
        max2Index = i;
      }
    }

    if (maxIndex > 0 && max2Index > 0) {
      const f1 = (maxIndex * nyquist) / binCount;
      const f2 = (max2Index * nyquist) / binCount;
      const lf = Math.min(f1, f2);
      const nf = Math.max(f1, f2);
      const k = lf / 19000;
      const rf = nf / k;
      return Math.round(rf / 200) * 200;
    }

    return 0;
  }

  return { listenFrequencies };
}
