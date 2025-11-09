import { useFrequencyListener } from "@/hooks/useFrequencyListener";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { playNumbers } from "@/utils/numberPlayer";
import { Button, View } from "react-native";

export default function Index() {
  const { playSequence } = useSineWavePlayer();
  const { listenFrequencies } = useFrequencyListener();

  function playSomeNumbers() {
    //playNumbers(playSequence, [12, 6, 736, 76, 16, 453, 43, 982]); // random numbers
    //playNumbers(playSequence, [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]); // bits going up
    //playNumbers(playSequence, [80, 136, 260, 514, 1025, 0, 0, 260, 260, 260, 260]); // smiley
    playNumbers(playSequence, [260, 260, 508, 508, 248, 903, 903]); // creeper
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
      <Button onPress={playSomeNumbers} title="Start Playing" />
      <Button onPress={listenForNumbers} title="Start Listening" />
    </View>
  );
}
