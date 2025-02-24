import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

// Azure OpenAI 설정 추가
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// YouTube API 설정
const YOUTUBE_API_KEY = "AIzaSyBcAwJBnmuJVux4c3ZzcBfZrIKHbFF9jnk";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

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
  private currentLocation: string = "";

  // 연령대별 장르 기본곡 매핑
  private ageGroupRecommendations: {
    [key: string]: { [key: string]: string };
  } = {
    child: {
      // 13세 미만
      pop: "NewJeans - Ditto",
      "k-pop": "IVE - LOVE DIVE",
      ballad: "IU - Eight",
      rock: "DAY6 - You Were Beautiful",
      hiphop: "BTS - Dynamite",
      jazz: "Disney Jazz - When You Wish Upon A Star",
      classical: "Yiruma - River Flows in You",
    },
    teen: {
      // 13-19세
      pop: "NewJeans - Super Shy",
      "k-pop": "LE SSERAFIM - UNFORGIVEN",
      ballad: "IU - Love poem",
      rock: "The Rose - Sorry",
      hiphop: "Stray Kids - S-Class",
      jazz: "Jamie Cullum - What A Difference A Day Made",
      classical: "Ludovico Einaudi - Experience",
    },
    adult: {
      // 20-39세
      pop: "Charlie Puth - Attention",
      "k-pop": "BTS - Spring Day",
      ballad: "성시경 - 거리에서",
      rock: "넬 - 기억을 걷는 시간",
      hiphop: "Epik High - 빈차",
      jazz: "Michael Bublé - Feeling Good",
      classical: "Joe Hisaishi - Summer",
    },
    middle: {
      // 40-59세
      pop: "ABBA - Dancing Queen",
      "k-pop": "소녀시대 - Forever 1",
      ballad: "이문세 - 광화문 연가",
      rock: "버스커버스커 - 벚꽃엔딩",
      hiphop: "다이나믹듀오 - 길",
      jazz: "Louis Armstrong - What A Wonderful World",
      classical: "Richard Clayderman - Mariage D Amour",
    },
    senior: {
      // 60세 이상
      pop: "Frank Sinatra - My Way",
      "k-pop": "조용필 - 단발머리",
      ballad: "김광석 - 서른즈음에",
      rock: "신중현과 엽전들 - 미인",
      hiphop: "현인 - 비와 당신",
      jazz: "Nat King Cole - Unforgettable",
      classical: "Claude Debussy - Clair de Lune",
    },
  };

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

  // 연령대 판별 함수
  private getAgeGroup(birthYear: number): string {
    const age = new Date().getFullYear() - birthYear;
    if (age < 13) return "child";
    if (age < 20) return "teen";
    if (age < 40) return "adult";
    if (age < 60) return "middle";
    return "senior";
  }

  // OpenAI를 통한 음악 추천
  private async getAIRecommendation(
    preferences: UserPreferences,
    location: string
  ): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const age = currentYear - preferences.birthYear;
      const ageGroup = this.getAgeGroup(preferences.birthYear);

      const prompt = `당신은 음악 추천 전문가입니다.
현재 ${age}세의 사용자가 ${location}에 있습니다.
선호하는 음악 장르는 ${preferences.musicGenre}입니다.
이 장소와 사용자의 취향을 고려하여 딱 한 곡을 추천해주세요.

응답 형식:
아티스트명 - 곡명

주의사항:
1. 반드시 실제로 존재하는 곡이어야 합니다
2. 연령대(${ageGroup})에 적합한 곡이어야 합니다
3. 장르(${preferences.musicGenre})와 장소(${location})의 분위기가 어울려야 합니다
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
      const recommendation = data.choices?.[0]?.message?.content;

      // AI 추천이 실패하면 연령대별 기본 추천곡 반환
      if (!recommendation) {
        console.log("AI 추천 실패, 연령대별 기본 추천곡 사용");
        const ageGroupSongs =
          this.ageGroupRecommendations[this.getAgeGroup(preferences.birthYear)];
        const defaultSong =
          ageGroupSongs[preferences.musicGenre.toLowerCase()] ||
          ageGroupSongs["pop"];
        return defaultSong;
      }

      return recommendation.trim();
    } catch (error) {
      console.error("AI recommendation error:", error);
      // 에러 발생 시 연령대별 기본 추천곡 반환
      const ageGroupSongs =
        this.ageGroupRecommendations[this.getAgeGroup(preferences.birthYear)];
      const defaultSong =
        ageGroupSongs[preferences.musicGenre.toLowerCase()] ||
        ageGroupSongs["pop"];
      return defaultSong;
    }
  }

  // YouTube에서 음악 검색
  private async searchYouTubeMusic(query: string): Promise<{
    videoId: string | null;
    title: string;
    artist: string;
  }> {
    try {
      const response = await fetch(
        `${YOUTUBE_API_URL}?part=snippet&q=${encodeURIComponent(
          query + " official music video"
        )}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}&maxResults=1`
      );

      if (!response.ok) {
        throw new Error("YouTube search failed");
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          videoId: video.id.videoId,
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
        };
      }

      throw new Error("No videos found");
    } catch (error) {
      console.error("YouTube search error:", error);
      return {
        videoId: null,
        title: "",
        artist: "",
      };
    }
  }

  // 사용자 취향 기반 음악 재생
  async playUserPreferredMusic(
    preferences: {
      birthYear: number;
      musicGenre: string;
    },
    location: string
  ): Promise<{
    videoId: string | null;
    message: string;
    title: string;
    artist: string;
  }> {
    try {
      // 이전 곡이 재생 중이면 중지
      if (this.currentLocation !== location) {
        await this.stop();
      }

      // OpenAI로부터 음악 추천 받기
      const recommendation = await this.getAIRecommendation(
        preferences,
        location
      );
      console.log("AI Recommended song:", recommendation);

      // YouTube에서 추천받은 곡 검색
      const result = await this.searchYouTubeMusic(recommendation);

      if (result.videoId) {
        this.currentVideoId = result.videoId;
        this.currentLocation = location;
        this.isPlaying = true;
        return {
          videoId: result.videoId,
          message: `${location}에서 "${result.title}"을(를) 재생합니다!`,
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
    this.isPlaying = false;
  }

  // 음악 재생
  async play(): Promise<void> {
    this.isPlaying = true;
  }

  // 음악 중지
  async stop(): Promise<void> {
    this.isPlaying = false;
    this.currentVideoId = null;
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
      const result = await this.searchYouTubeMusic(`${location} ambient music`);

      if (result.videoId) {
        this.currentVideoId = result.videoId;
        this.isPlaying = true;
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
