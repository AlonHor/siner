import {
  CARRIER_FREQUENCY,
  MAX_FREQ,
  MIN_FREQ,
  NUMBERS_BOTTOM_FREQUENCY,
  NUMBERS_TOP_FREQUENCY,
  SAMPLE_RATE,
} from "@/utils/config";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
} from "react-native";

const { Ultrasonic } = NativeModules;

const GAP = (NUMBERS_TOP_FREQUENCY - NUMBERS_BOTTOM_FREQUENCY) / 10;

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
      (f: number) => setFreq(Math.round(f / GAP) * GAP),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
  }, []);

  return freq;
}
