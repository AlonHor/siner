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
    async (
      freq: number,
      channelFactor: React.RefObject<number>,
      duration: number,
    ) => {
      // merge carrier + requested freqs
      const finalFreqs =
        CARRIER_BASE_FREQUENCY != null
          ? [
              freq + channelFactor.current,
              CARRIER_BASE_FREQUENCY + channelFactor.current,
            ]
          : [freq + channelFactor.current];

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
  freqs: number[],
  duration: number,
  sampleRate: number,
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * duration);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const fadeTime = 0.005;
  const fadeSamples = Math.floor(sampleRate * fadeTime);

  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t);
    }

    sample /= freqs.length; // avoid clipping

    // fade to avoid ticks
    let env = 1;
    if (i < fadeSamples) {
      env = i / fadeSamples;
    } else if (i > numSamples - fadeSamples) {
      env = (numSamples - i) / fadeSamples;
    }

    const amp = Math.floor(sample * env * 0x7fff * 0.9);
    view.setInt16(offset, amp, true);
    offset += 2;
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
