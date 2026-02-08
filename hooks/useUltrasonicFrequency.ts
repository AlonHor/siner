import {
  CARRIER_BASE_FREQUENCY,
  ERROR_DETECTED_BASE_FREQUENCY,
  FREQUENCY_GAP,
  GLOBAL_SILENT_FREQ,
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
  const [channelFactor, setChannelFactor] = useState<number>(0);

  useEffect(() => {
    console.log(
      `restarting ultrasonic service with channel factor ${channelFactor}`,
    );
    (async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      Ultrasonic.start(
        SAMPLE_RATE,
        CARRIER_BASE_FREQUENCY + channelFactor,
        GLOBAL_SILENT_FREQ - FREQUENCY_GAP / 2,
        ERROR_DETECTED_BASE_FREQUENCY + channelFactor + FREQUENCY_GAP / 2,
        GLOBAL_SILENT_FREQ,
        30,
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
  }, [channelFactor]);

  return { freq, channelFactor, setChannelFactor };
}
