import { Buffer } from "buffer";
import { Audio } from "expo-av";
import { useCallback, useRef, useState } from "react";

export type ToneStep = number[]; // array of frequencies to play together

export function useSineWavePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSound = useRef<Audio.Sound | null>(null);

  /**
   * Play a sequence of steps. Each step is an array of frequencies played together.
   * @param sequence Array of steps, e.g. [[19600, 20000], [19200, 19800]]
   * @param stepDuration Duration in seconds for each step
   */
  const playSequence = useCallback(
    async (sequence: ToneStep[], stepDuration: number) => {
      if (isPlaying) return;
      setIsPlaying(true);

      try {
        for (const freqs of sequence) {
          // generate WAV with summed frequencies
          const base64 = generatePolyphonicWav(freqs, stepDuration, 48000);
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
        }
      } catch (e) {
        console.error("Playback error:", e);
      } finally {
        currentSound.current = null;
        setIsPlaying(false);
      }
    },
    [isPlaying]
  );

  const stop = useCallback(async () => {
    if (currentSound.current) {
      await currentSound.current.stopAsync();
      await currentSound.current.unloadAsync();
      currentSound.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { isPlaying, playSequence, stop };
}

/**
 * Generate a WAV base64 string that sums multiple sine waves
 */
function generatePolyphonicWav(
  freqs: number[],
  duration: number,
  sampleRate: number
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

  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t);
    }
    sample /= freqs.length; // prevent clipping by averaging
    const amp = Math.floor(sample * 0x7fff * 0.9);
    view.setInt16(offset, amp, true);
    offset += 2;
  }

  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++)
    view.setUint8(offset + i, str.charCodeAt(i));
}
