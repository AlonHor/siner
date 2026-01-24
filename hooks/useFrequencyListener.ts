import { CARRIER_FREQUENCY, SAMPLE_RATE } from "@/utils/config";
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
};

export function useUltrasonicFrequency(config?: ListenerConfig) {
  const { sampleRate = SAMPLE_RATE, carrierFreq = CARRIER_FREQUENCY } =
    config ?? {};

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
      (f: number) => setFreq(Math.round(f / 200) * 200),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return freq;
}
