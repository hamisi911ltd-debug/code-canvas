declare module 'intasend-inlinejs-sdk' {
  export default class IntaSend {
    constructor(options: { publicAPIKey?: string; live?: boolean; methods?: string[]; redirectURL?: string })
    on(event: 'COMPLETE' | 'FAILED' | 'IN-PROGRESS', callback: (result: unknown) => void): IntaSend
    run(payload: Record<string, unknown>): void
  }
}
