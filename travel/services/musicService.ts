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
    [key: string]: { [key: string]: string[] };
  } = {
    teen: {
      // 13-19세
      pop: [
        "Doechii - DENIAL IS A RIVER",
        "Maroon 5 - Lucky Strike",
        "Benson Boone - Beautiful Things",
        "Betsy, Мария Янковская - Sigma Boy",
        "X Ambassadors - BOOM",
        "Betty Who - Look Back",
        "EASHA - Far Away",
      ],
      kpop: [
        "IVE - ATTITUDE",
        "카리나 - UP",
        "NewJeans - How Sweet",
        "ROSÉ & Bruno Mars - APT.",
      ],
      ballad: [
        "Justin Bieber - All That Matters",
        "아이유 - 밤편지",
        "ROSÉ - number one girl",
      ],
      rock: [
        "KiiiKiii - I DO ME",
        "DAY6 - You Were Beautiful",
        "Green Day - Boulevard of Broken Dreams",
      ],
      hiphop: [
        "Kendrick Lamar - Not Like Us",
        "J.I.D - Surround Sound ",
        "Stray Kids - God's Menu",
      ],
      jazz: [
        "Disney Jazz - When You Wish Upon A Star",
        "Claire Rosinkranz - Don't miss me",
      ],
      classical: [
        "Yiruma - River Flows in You",
        "Mozart - Eine kleine Nachtmusik",
      ],
    },
    youngAdult: {
      // 20-39세
      pop: [
        "Benson Boone - Slow It Down",
        "Sabrina Carpenter - Please Please Please",
        "Taylor Swift - Fortnight",
        "Ain't Nothing Wrong With That",
        "Alice Merton - No Roots",
        "Lauv - Paris in the rain",
        "24 - sundial",
      ],
      kpop: [
        "아이유 - 밤편지",
        "디오 - 별 떨어진다",
        "NewJeans - GODS",
        "아이유 - 홀씨",
      ],
      ballad: [
        "SZA - BMF",
        "Paul Kim - 커피 한잔 할래요",
        "Honne - Warm On a Cold Night",
      ],
      rock: [
        "넬 - 기억을 걷는 시간",
        "Hozier - Too Sweet",
        "Lord Huron - The Night We Met",
      ],
      hiphop: [
        "Epik High - 빈차",
        "Drake - Hotline Bling",
        "Kendrick Lamar - luther",
      ],
      jazz: ["Lana Del Rey - Blue Jeans", "Norah Jones - Don't Know Why"],
      classical: ["Joe Hisaishi - Summer", "Debussy - Clair de Lune"],
    },
    middle: {
      // 40-59세
      pop: [
        "Mind by Eve - Let Me Blow",
        "Bruno Mars - Runaway Baby",
        "Maroon 5 - Moves Like Jagger",
      ],
      kpop: [
        "소녀시대 - Forever 1",
        "조용필 - 친구여",
        "투투 - 일과 이분의 일",
      ],
      ballad: [
        "이문세 - 광화문 연가",
        "김광석 - 잊어야 한다는 마음으로",
        "이승철 - 소녀",
        "델리스파이스- 고백",
      ],
      rock: [
        "체리필터 - 낭만고양이",
        "Queen - Bohemian Rhapsody",
        "The Beatles - Let It Be",
      ],
      hiphop: [
        "다이나믹듀오 - 길",
        "Eminem - Lose Yourself",
        "Nas - The World Is Yours",
      ],
      jazz: [
        "Louis Armstrong - What A Wonderful World",
        "Sarah Vaughan - Misty",
        "Michael Bublé - Feeling Good",
      ],
      classical: [
        "Richard Clayderman - Mariage D Amour",
        "Beethoven - Moonlight Sonata",
      ],
    },
    senior: {
      // 60-70세
      pop: [
        "ABBA - Dancing Queen",
        "The Carpenters - Close to You",
        "Frank Sinatra - Strangers in the Night",
      ],
      kpop: ["조용필 - 단발머리", "이문세 - 붉은 노을", "나훈아 - 테스형"],
      ballad: ["김광석 - 서른즈음에", "조관우 - 꽃밭에서", "이선희 - 인연"],
      rock: [
        "신중현과 엽전들 - 미인",
        "The Rolling Stones - (I Can't Get No) Satisfaction",
      ],
      hiphop: ["현인 - 비와 당신", "한대수 - 물 좀 주소"],
      jazz: [
        "Nat King Cole - Unforgettable",
        "Duke Ellington - Take the A Train",
      ],
      classical: [
        "Claude Debussy - Clair de Lune",
        "Johann Sebastian Bach - Air on the G String",
      ],
    },
    elder: {
      // 70세 이상
      pop: [
        "Elvis Presley - Can't Help Falling in Love",
        "Frank Sinatra - My Way",
        "The Everly Brothers - All I Have to Do Is Dream",
      ],
      kpop: ["남진 - 둥지", "이미자 - 동백아가씨"],
      ballad: ["패티김 - 가을을 남기고 간 사랑", "현미 - 밤안개"],
      rock: ["The Beatles - Hey Jude", "신중현 - 미인"],
      hiphop: ["배호 - 돌아가는 삼각지", "김추자 - 님은 먼 곳에"],
      jazz: [
        "Ella Fitzgerald - Dream a Little Dream of Me",
        "Django Reinhardt - Minor Swing",
      ],
      classical: ["Franz Schubert - Ave Maria", "Erik Satie - Gymnopédie No.1"],
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
    if (age < 40) return "youngAdult";
    if (age < 60) return "middle";
    if (age < 70) return "senior";
    return "elder";
  }

  private getRandomSong(songs: string[]): string {
    return songs[Math.floor(Math.random() * songs.length)];
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
        const genreSongs =
          ageGroupSongs[preferences.musicGenre.toLowerCase()] ||
          ageGroupSongs["pop"];
        return this.getRandomSong(genreSongs);
      }

      return recommendation.trim();
    } catch (error) {
      console.error("AI recommendation error:", error);
      // 에러 발생 시 연령대별 기본 추천곡 반환
      const ageGroupSongs =
        this.ageGroupRecommendations[this.getAgeGroup(preferences.birthYear)];
      const genreSongs =
        ageGroupSongs[preferences.musicGenre.toLowerCase()] ||
        ageGroupSongs["pop"];
      return this.getRandomSong(genreSongs);
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

  normalizeMusicGenre = (genre: string): string => {
    const normalizedGenre = genre.toLowerCase();
    switch (normalizedGenre) {
      case "k-pop":
      case "k pop":
      case "kpop":
        return "kpop";
      case "hip hop":
      case "hip-hop":
        return "hiphop";
      case "classic":
      case "classics":
      case "classical":
        return "classical";
      case "popular":
      case "pop music":
        return "pop";
      case "rhythm and blues":
      case "r&b":
      case "rnb":
        return "ballad";
      default:
        // pop, kpop, ballad, rock, hiphop, jazz, classical는 이미 소문자로 정규화되어 있으므로 그대로 반환
        if (
          [
            "pop",
            "kpop",
            "ballad",
            "rock",
            "hiphop",
            "jazz",
            "classical",
          ].includes(normalizedGenre)
        ) {
          return normalizedGenre;
        }
        return "pop"; // 알 수 없는 장르는 pop으로 기본 설정
    }
  };
}
