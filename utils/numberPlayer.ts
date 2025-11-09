export function getNumberFreqs(n: number) {
  const freqs: number[] = [];
  for (let i = 1; i < 1024; i *= 2) {
    if ((n & i) !== 0) {
      freqs.push(21000 - Math.log2(i) * 200);
    }
  }

  console.log(freqs);
  return freqs;
}

/*
  19000 // 1024
  19200 // 512
  19400 // 256
  19600 // 128
  19800 // 64
  20000 // 32
  20200 // 16
  20400 // 8
  20600 // 4
  20800 // 2
  21000 // 1
*/

export function playNumbers(playSequence: Function, numbers: number[]) {
  const sequence = [];
  for (let number of numbers) {
    sequence.push(getNumberFreqs(number));
  }
  playSequence(sequence, 0.5);
}
