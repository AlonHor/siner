import { fft } from "fft-js";
import { useCallback } from "react";
import AudioRecord from "react-native-audio-record";
import { WaveFile } from "wavefile";

export type FrequencyListenerResult = boolean[][];

export function useFrequencyListener() {
  const listenFrequencies = useCallback(
    async (
      freqs: number[],
      stepDuration: number,
      totalDuration: number,
      thresholdDb: number
    ): Promise<FrequencyListenerResult> => {
      // Configure recorder
      AudioRecord.init({
        sampleRate: 44100,
        channels: 1,
        bitsPerSample: 16,
        wavFile: "temp.wav",
      });

      AudioRecord.start();

      // Wait total duration
      await new Promise((resolve) => setTimeout(resolve, totalDuration * 1000));

      const audioFile = await AudioRecord.stop();

      // Load WAV file
      const wavBytes = await fetch(`file://${audioFile}`).then((res) =>
        res.arrayBuffer()
      );
      const wav = new WaveFile(new Uint8Array(wavBytes));

      const samples = wav.getSamples(true, Int16Array); // normalized floats [-1,1]
      const sampleRate = (wav.fmt as any).sampleRate;

      const stepSamples = Math.floor(stepDuration * sampleRate);
      const totalSteps = Math.ceil(totalDuration / stepDuration);

      const results: FrequencyListenerResult = [];

      for (let step = 0; step < totalSteps; step++) {
        const start = step * stepSamples;
        const end = Math.min(start + stepSamples, samples.length);
        const stepSamplesArr = Array.from(samples.slice(start, end));

        const phasors = fft(stepSamplesArr);
        const magnitudes = phasors.map(([re, im]) =>
          Math.sqrt(re * re + im * im)
        );

        const stepResult = freqs.map((freq) => {
          const bin = Math.round(freq / (sampleRate / phasors.length));
          const mag = magnitudes[bin];
          const db = 20 * Math.log10(mag + 1e-8);
          return db >= thresholdDb;
        });

        results.push(stepResult);
      }

      return results;
    },
    []
  );

  return { listenFrequencies };
}
