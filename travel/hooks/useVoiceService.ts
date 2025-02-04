import { useCallback } from "react"
import * as Speech from "expo-speech"

export function useVoiceService() {
  const speak = useCallback(async (text: string) => {
    try {
      await Speech.speak(text, {
        language: "ko-KR",
        pitch: 1.0,
        rate: 0.9,
      })
    } catch (error) {
      console.error("Failed to speak:", error)
    }
  }, [])

  return { speak }
}

