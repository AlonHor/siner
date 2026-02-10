import {
  CARRIER_BASE_FREQUENCY,
  FREQUENCY_ROUND_GAP,
  SAMPLE_RATE,
  SILENT_BASE_FREQUENCY,
  TOP_BASE_FREQUENCY,
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
    const FREQUENCY_MARGIN = FREQUENCY_ROUND_GAP / 2;

    const FFT_MIN = CARRIER_BASE_FREQUENCY + channelFactor - FREQUENCY_MARGIN;
    const FFT_MAX = TOP_BASE_FREQUENCY + channelFactor + FREQUENCY_MARGIN;

    console.log(
      `ultrasonic service: {+${channelFactor}} [${FFT_MIN}+ ~${CARRIER_BASE_FREQUENCY + channelFactor} -${FFT_MAX}]`,
    );

    (async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      Ultrasonic.start(
        SAMPLE_RATE,
        CARRIER_BASE_FREQUENCY + channelFactor, // carrier freq + factor
        FFT_MIN,
        FFT_MAX,
        SILENT_BASE_FREQUENCY + channelFactor, // silent freq + factor
        10, // silent db threshold
        FREQUENCY_ROUND_GAP,
      );
    })();

    const sub = DeviceEventEmitter.addListener(
      "ultrasonicFrequency",
      (f: number) =>
        setFreq(Math.round(f / FREQUENCY_ROUND_GAP) * FREQUENCY_ROUND_GAP),
    );

    return () => {
      sub.remove();
      Ultrasonic.stop();
    };
  }, [channelFactor]);

  return { freq, channelFactor, setChannelFactor };
}
