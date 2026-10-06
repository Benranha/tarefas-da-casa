declare module 'canvas-confetti' {
  type Options = Record<string, unknown>
  export default function confetti(options?: Options): Promise<null> | null
}
