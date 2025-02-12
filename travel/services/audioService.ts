import * as azureSpeech from "microsoft-cognitiveservices-speech-sdk";

const SPEECH_KEY = "your_key";
const SPEECH_REGION = "eastus";

export class AudioService {
  private synthesizer: azureSpeech.SpeechSynthesizer | null = null;

  initialize = async () => {
    const speechConfig = azureSpeech.SpeechConfig.fromSubscription(
      SPEECH_KEY,
      SPEECH_REGION
    );
    speechConfig.speechSynthesisVoiceName = "ko-KR-HyunsuMultilingualNeural";
    this.synthesizer = new azureSpeech.SpeechSynthesizer(speechConfig);
  };

  speakText = async (text: string) => {
    if (!this.synthesizer) return;
    const result = await this.synthesizer.speakTextAsync(text);
    return result;
  };

  stopSpeaking = () => {
    if (this.synthesizer) {
      this.synthesizer.close();
      this.synthesizer = null;
    }
  };

  cleanup = () => {
    this.stopSpeaking();
  };
}
