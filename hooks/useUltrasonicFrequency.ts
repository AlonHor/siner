import {
  CARRIER_FREQUENCY,
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

type ListenerConfig = {
  sampleRate?: number;
  carrierFreq?: number | null; // null = disable carrier
  gap?: number;
};

export function useUltrasonicFrequency(config?: ListenerConfig) {
  const {
    sampleRate = SAMPLE_RATE,
    carrierFreq = CARRIER_FREQUENCY,
    gap = (NUMBERS_TOP_FREQUENCY - NUMBERS_BOTTOM_FREQUENCY) / 10,
  } = config ?? {};

  const [freq, setFreq] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      Ultrasonic.start(sampleRate, carrierFreq);
    })();

    const sub = DeviceEventEmitter.addListener(
      "ultrasonicFrequency",
      (f: number) => setFreq(Math.round(f / gap) * gap),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
  }, [carrierFreq, sampleRate, gap]);

  return freq;
}
