import { useFrequencyListener } from "@/hooks/useFrequencyListener";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { playNumbers } from "@/utils/numberPlayer";
import React, { useState } from "react";
import { Button, Text, View } from "react-native";

export default function Index() {
  const { playSequence } = useSineWavePlayer();
  const [currentRF, setCurrentRF] = useState<number>(0);

  const { listenFrequencies } = useFrequencyListener();

  function playSomeNumbers() {
    playNumbers(playSequence, [260, 260, 508, 508, 248, 903, 903]);
  }

  async function listenForNumbers() {
    const rf = await listenFrequencies()
    setCurrentRF(rf);
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>RF: {currentRF}</Text>
      <Button onPress={playSomeNumbers} title="Start Playing" />
      <Button onPress={listenForNumbers} title="Start Listening" />
    </View>
  );
}
