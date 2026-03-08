declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string | Array<{role: string, content: any}>,
          options?: {
            model?: string
            stream?: boolean
            image?: string
          }
        ) => Promise<any>
      }
    }
  }
}
export {}
