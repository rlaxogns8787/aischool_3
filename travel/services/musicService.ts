import axios from "axios";
import { Audio } from "expo-av";

const YOUTUBE_API_KEY = "AIzaSyBcAwJBnmuJVux4c3ZzcBfZrIKHbFF9jnk"; // YouTube API 키를 여기에 입력
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

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
  }

  // YouTube API를 통해 음악 검색
  private async searchYoutubeMusic(query: string): Promise<string | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          part: "snippet",
          maxResults: 1,
          q: query,
          type: "video",
          videoCategoryId: "10", // Music category
          key: YOUTUBE_API_KEY,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.videoId;
      }
      return null;
    } catch (error) {
      console.error("YouTube search error:", error);
      return null;
    }
  }

  // 사용자 취향과 연령대 기반 음악 추천
  private getRecommendedArtists(preferences: UserPreferences): string[] {
    const { birthYear, musicGenre } = preferences;
    const age = new Date().getFullYear() - birthYear;

    // 장르별, 연령대별 아티스트 매핑
    const artistMap: ArtistMap = {
      pop: {
        young: ["Billie Eilish", "Olivia Rodrigo", "The Kid LAROI"],
        middle: ["Ed Sheeran", "Taylor Swift", "Post Malone"],
        older: ["Adele", "Bruno Mars", "Justin Timberlake"],
      },
      rock: {
        young: ["Maneskin", "Machine Gun Kelly", "Royal Blood"],
        middle: ["Imagine Dragons", "Twenty One Pilots", "The 1975"],
        older: ["Foo Fighters", "Green Day", "Muse"],
      },
      hiphop: {
        young: ["Jack Harlow", "Lil Nas X", "Doja Cat"],
        middle: ["Drake", "Travis Scott", "Kendrick Lamar"],
        older: ["Eminem", "Jay-Z", "Kanye West"],
      },
      // 다른 장르들도 추가 가능
    };

    // 연령대 결정
    let ageGroup = "middle";
    if (age < 25) ageGroup = "young";
    else if (age > 35) ageGroup = "older";

    // 해당 장르와 연령대의 아티스트 반환
    return artistMap[musicGenre]?.[ageGroup] || ["pop music"];
  }

  // 다음 장소로 이동할 때 음악 재생
  async playTransitMusic(
    userPreferences: UserPreferences
  ): Promise<{ videoId: string | null; message: string }> {
    try {
      const artists = this.getRecommendedArtists(userPreferences);
      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      const query = `${randomArtist} ${userPreferences.musicGenre} music`;

      const videoId = await this.searchYoutubeMusic(query);
      if (videoId) {
        this.isPlaying = true;
        return {
          videoId,
          message: `다음 목적지까지 가는 동안, 요즘 핫한 ${userPreferences.musicGenre} 음악을 들어볼까요?`,
        };
      }
      return {
        videoId: null,
        message: "음악을 준비하는 중입니다...",
      };
    } catch (error) {
      console.error("Transit music error:", error);
      return {
        videoId: null,
        message: "음악 재생에 실패했습니다.",
      };
    }
  }

  // 현재 재생 상태 확인
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // 재생 중지
  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.isPlaying = false;
    this.currentVideoId = null;
  }

  async searchYouTubeVideo(query: string): Promise<string | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          maxResults: 1,
          key: YOUTUBE_API_KEY,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.videoId;
      }
      return null;
    } catch (error) {
      console.error("YouTube search error:", error);
      return null;
    }
  }

  async playLocationBGM(location: string): Promise<{
    videoId: string | null;
    message: string;
    title?: string;
    artist?: string;
  }> {
    try {
      const query = `${location} ambient music`;
      const videoId = await this.searchYouTubeVideo(query);

      if (videoId) {
        this.currentVideoId = videoId;
        return {
          videoId,
          message: `${location}의 분위기에 어울리는 음악을 찾았습니다!`,
          title: `${location} Ambient Music`,
          artist: "Various Artists",
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

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

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
      const artists = this.getRecommendedArtists(preferences);
      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      const query = `${randomArtist} ${preferences.musicGenre} music`;

      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          part: "snippet",
          maxResults: 1,
          q: query,
          type: "video",
          videoCategoryId: "10", // Music category
          key: YOUTUBE_API_KEY,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        const videoId = response.data.items[0].id.videoId;
        const title = response.data.items[0].snippet.title;
        const artist = randomArtist;

        this.currentVideoId = videoId;
        this.isPlaying = true;

        return {
          videoId,
          message: "당신의 취향에 맞는 음악을 준비했습니다!",
          title,
          artist,
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

  /* 이전 기능들 주석 처리 (나중에 사용할 수 있음) */
  /*
  // AI 기반 플레이리스트 생성
  async generateAIPlaylist(
    location: string,
    userPreference: string
  ): Promise<MusicTrack[]> {
    try {
      // GPT-4를 통한 플레이리스트 생성 로직
      const prompt = `
        Create a 5-song playlist for someone visiting ${location}.
        They prefer ${userPreference} music.
        Format: JSON array of {title, artist}
      `;

      // TODO: Implement actual GPT-4 call
      // For now, return sample data
      const samplePlaylist: MusicTrack[] = [
        { title: "Sample Song 1", artist: "Artist 1", videoId: "" },
        { title: "Sample Song 2", artist: "Artist 2", videoId: "" },
      // 각 곡에 대한 YouTube 검색
      ];

      for (let track of samplePlaylist) {
        const query = `${track.title} ${track.artist}`;
        const videoId = await this.searchYoutubeMusic(query);
        if (videoId) {
          track.videoId = videoId;
        }
      }

      this.currentPlaylist = samplePlaylist;
      return samplePlaylist;
    } catch (error) {
      console.error("AI playlist generation error:", error);
      return [];
    }
  }
  */
}
