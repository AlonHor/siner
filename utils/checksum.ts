export function calculateChecksum(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, c) => a + c);
}
