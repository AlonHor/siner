import { CARRIER_BASE_FREQUENCY, SAMPLE_RATE } from "@/utils/config";
import { Audio } from "expo-av";
import { useCallback, useRef, useState } from "react";

export type ToneStep = number[];

export function useSineWavePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSound = useRef<Audio.Sound | null>(null);

  /**
   * Plays a single tone (plus carrier if enabled) for a fixed duration.
   */
  const playTone = useCallback(
    async (freqs: number[], channelFactor: number, duration: number) => {
      // merge carrier + requested freqs
      const finalFreqs = freqs.map((freq) =>
        CARRIER_BASE_FREQUENCY != null
          ? [freq + channelFactor, CARRIER_BASE_FREQUENCY + channelFactor]
          : [freq + channelFactor],
      );

      const base64 = generatePolyphonicWav(finalFreqs, duration, SAMPLE_RATE);

      const { sound } = await Audio.Sound.createAsync({
        uri: "data:audio/wav;base64," + base64,
      });

      currentSound.current = sound;
      await sound.playAsync();

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ("didJustFinish" in status && status.didJustFinish) {
            sound.unloadAsync();
            resolve();
          }
        });
      });

      currentSound.current = null;
    },
    [],
  );

  const stop = useCallback(async () => {
    if (currentSound.current) {
      await currentSound.current.stopAsync();
      await currentSound.current.unloadAsync();
      currentSound.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    playTone,
    stop,
  };
}

function generatePolyphonicWav(
  freqs: number[][], // array of frequency groups
  duration: number, // duration of each group
  sampleRate: number,
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  const fadeTime = 0.005;
  const fadeSamples = Math.floor(sampleRate * fadeTime);

  // total samples = duration per group * number of groups
  const numSamplesPerGroup = Math.floor(sampleRate * duration);
  const totalSamples = numSamplesPerGroup * freqs.length;
  const dataSize = totalSamples * blockAlign;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = headerSize;

  for (const group of freqs) {
    for (let i = 0; i < numSamplesPerGroup; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const f of group) {
        sample += Math.sin(2 * Math.PI * f * t);
      }

      sample /= group.length; // avoid clipping

      // fade in/out to avoid clicks
      let env = 1;
      if (i < fadeSamples) {
        env = i / fadeSamples;
      } else if (i > numSamplesPerGroup - fadeSamples) {
        env = (numSamplesPerGroup - i) / fadeSamples;
      }

      const amp = Math.floor(sample * env * 0x7fff * 0.9);
      view.setInt16(offset, amp, true);
      offset += 2;
    }
  }

  return uint8ToBase64(new Uint8Array(buffer));
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000; // prevent call stack overflow

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}
