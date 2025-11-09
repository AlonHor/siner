declare module "fft-js" {
  export function fft(input: number[]): [number, number][];
  export function ifft(input: [number, number][]): number[];
}
