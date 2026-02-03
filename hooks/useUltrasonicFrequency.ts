import {
  CARRIER_BASE_FREQUENCY,
  FREQUENCY_GAP,
  MAX_FFT_FREQ,
  MIN_FFT_FREQ,
  SAMPLE_RATE,
} from "@/utils/config";
import React, { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
} from "react-native";

const { Ultrasonic } = NativeModules;

export function useUltrasonicFrequency({
  channelFactor,
}: {
  channelFactor: React.RefObject<number>;
}) {
  const [freq, setFreq] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      Ultrasonic.start(
        SAMPLE_RATE,
        CARRIER_BASE_FREQUENCY + channelFactor.current,
        MIN_FFT_FREQ,
        MAX_FFT_FREQ,
      );
    })();

    const sub = DeviceEventEmitter.addListener(
      "ultrasonicFrequency",
      (f: number) => setFreq(Math.round(f / FREQUENCY_GAP) * FREQUENCY_GAP),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFactor.current]);

  return freq;
}
