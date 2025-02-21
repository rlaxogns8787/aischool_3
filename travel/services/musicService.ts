import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

// Azure OpenAI 설정 추가
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

interface MusicTrack {
  title: string;
  artist: string;
  videoId: string;
}

interface UserPreferences {
  birthYear: number;
  musicGenre: string;
}

// 장르별, 연령대별 아티스트 매핑에 타입 정의 추가
type ArtistMap = {
  [key: string]: {
    [key: string]: string[];
  };
};

export class MusicService {
  private currentPlaylist: MusicTrack[] = [];
  private isPlaying: boolean = false;
  private sound: Audio.Sound | null = null;
  private currentVideoId: string | null = null;

  constructor() {
    this.sound = null;
    this.currentVideoId = null;
    this.initialize();
  }

  // Audio 초기화
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }

  // OpenAI를 통한 음악 추천
  private async getAIRecommendation(
    preferences: UserPreferences
  ): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const age = currentYear - preferences.birthYear;

      const prompt = `당신은 음악 추천 전문가입니다.
현재 ${age}세의 사용자가 ${preferences.musicGenre} 장르의 음악을 듣고 싶어합니다.
이 사용자의 연령대와 선호 장르를 고려하여 딱 한 곡을 추천해주세요.

응답 형식:
아티스트명 - 곡명

주의사항:
1. 반드시 실제로 존재하는 곡이어야 합니다
2. 연령대에 적합한 곡이어야 합니다
3. 장르가 일치해야 합니다
4. 응답은 "아티스트명 - 곡명" 형식으로만 해주세요`;

      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: "음악을 추천해주세요." },
            ],
            temperature: 0.7,
            max_tokens: 50,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI recommendation");
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("AI recommendation error:", error);
      throw error;
    }
  }

  // 음악 검색 및 재생
  private async searchAndPlayMusic(query: string): Promise<{
    videoId: string | null;
    title: string;
    artist: string;
  }> {
    try {
      // 테스트용 오디오 URL 사용
      const testAudioUrl =
        "https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav";

      if (this.sound) {
        await this.sound.unloadAsync();
      }

      console.log("Loading audio...");
      this.sound = new Audio.Sound();
      await this.sound.loadAsync({ uri: testAudioUrl });

      console.log("Playing audio...");
      await this.sound.playAsync();
      this.isPlaying = true;

      // 재생 상태 모니터링
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          this.isPlaying = status.isPlaying;
          console.log(
            "Playback status:",
            status.isPlaying ? "playing" : "paused"
          );
        }
      });

      return {
        videoId: "test",
        title: "Test Audio",
        artist: "Sample",
      };
    } catch (error) {
      console.error("Audio playback error:", error);
      return {
        videoId: null,
        title: "",
        artist: "",
      };
    }
  }

  // 사용자 취향 기반 음악 재생
  async playUserPreferredMusic(preferences: {
    birthYear: number;
    musicGenre: string;
  }): Promise<{
    videoId: string | null;
    message: string;
    title: string;
    artist: string;
  }> {
    try {
      // OpenAI로부터 음악 추천 받기
      const recommendation = await this.getAIRecommendation(preferences);
      console.log("AI Recommended song:", recommendation);

      // 추천받은 곡 검색 및 재생
      const result = await this.searchAndPlayMusic(recommendation);

      if (result.videoId) {
        return {
          videoId: result.videoId,
          message: `AI가 추천한 "${result.title}"을(를) 재생합니다!`,
          title: result.title,
          artist: result.artist,
        };
      }

      return {
        videoId: null,
        message: "음악을 찾을 수 없습니다.",
        title: "",
        artist: "",
      };
    } catch (error) {
      console.error("User preferred music error:", error);
      return {
        videoId: null,
        message: "음악 재생 중 오류가 발생했습니다.",
        title: "",
        artist: "",
      };
    }
  }

  // 음악 일시정지
  async pause(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        console.log("Pausing audio...");
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }

  // 음악 재생
  async play(): Promise<void> {
    try {
      if (this.sound && !this.isPlaying) {
        console.log("Resuming audio...");
        await this.sound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  // 음악 중지
  async stop(): Promise<void> {
    try {
      if (this.sound) {
        console.log("Stopping audio...");
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.isPlaying = false;
        this.currentVideoId = null;
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  }

  // 현재 재생 상태 확인
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // 현재 재생 중인 비디오 ID 반환
  getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }

  // 위치 기반 배경음악 재생
  async playLocationBGM(location: string): Promise<{
    videoId: string | null;
    message: string;
    title?: string;
    artist?: string;
  }> {
    try {
      const result = await this.searchAndPlayMusic(`${location} ambient music`);

      if (result.videoId) {
        return {
          videoId: result.videoId,
          message: `${location}의 분위기에 어울리는 음악을 찾았습니다!`,
          title: result.title,
          artist: result.artist,
        };
      }

      return {
        videoId: null,
        message: "음악을 찾을 수 없습니다.",
      };
    } catch (error) {
      console.error("Location BGM error:", error);
      return {
        videoId: null,
        message: "음악 재생 중 오류가 발생했습니다.",
      };
    }
  }
}
