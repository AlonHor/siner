import {
  CARRIER_FREQUENCY,
  FREQUENCY_GAP,
  MAX_FREQ,
  MIN_FREQ,
  SAMPLE_RATE,
} from "@/utils/config";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
} from "react-native";

const { Ultrasonic } = NativeModules;

export function useUltrasonicFrequency() {
  const [freq, setFreq] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      Ultrasonic.start(SAMPLE_RATE, CARRIER_FREQUENCY, MIN_FREQ, MAX_FREQ);
    })();

    const sub = DeviceEventEmitter.addListener(
      "ultrasonicFrequency",
      (f: number) => setFreq(Math.round(f / FREQUENCY_GAP) * FREQUENCY_GAP),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
  }, []);

  return freq;
}
