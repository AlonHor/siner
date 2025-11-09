import { Button, Text, View } from "react-native";
import { useFrequencyListener } from "../hooks/useFrequencyListener";
import { useSineWavePlayer } from "../hooks/useSineWavePlayer";
import { playNumbers } from "../utils/numberPlayer";

export default function Index() {
  const { playSequence } = useSineWavePlayer();
  const { listenFrequencies } = useFrequencyListener();

  function playSomeNumbers() {
    playNumbers(playSequence, [12, 6, 32, 76, 16, 453, 43, 982]);
  }

  function listenForNumbers() {
    console.log(listenFrequencies([20200, 19600], 0.5, 5, -80));
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button onPress={playSomeNumbers} title="Start Playing" />
      <Button onPress={listenForNumbers} title="Start Listening" />
    </View>
  );
}
