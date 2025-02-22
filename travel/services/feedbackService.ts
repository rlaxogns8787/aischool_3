import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://5a031-gce0e3fhexdbh4c6.eastus-01.azurewebsites.net";

interface FeedbackData {
  rating: number;
  emotion: string;
  feedback: string;
  location?: string;
  timestamp?: string;
}

interface AnalyzedFeedback {
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
  improvements: string[];
  summary: string;
}

export class FeedbackService {
  private readonly AZURE_OPENAI_ENDPOINT =
    "https://ssapy-openai.openai.azure.com/";
  private readonly AZURE_OPENAI_KEY =
    "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
  private readonly DEPLOYMENT_NAME = "gpt-4o";

  async analyzeFeedback(feedbackData: FeedbackData): Promise<AnalyzedFeedback> {
    try {
      const prompt = `
분석해야 할 여행 가이드 피드백:
- 별점: ${feedbackData.rating}/5
- 감정: ${feedbackData.emotion}
- 피드백 내용: "${feedbackData.feedback}"
${feedbackData.location ? `- 장소: ${feedbackData.location}` : ""}

다음 형식으로 분석해주세요:
1. 감정 분석 (positive/neutral/negative)
2. 주요 키워드 (배열)
3. 개선이 필요한 부분 (배열)
4. 전체 요약 (한 문장)

응답은 JSON 형식으로 해주세요:
{
  "sentiment": "positive/neutral/negative",
  "keywords": ["키워드1", "키워드2"],
  "improvements": ["개선사항1", "개선사항2"],
  "summary": "전체 요약"
}`;

      const response = await fetch(
        `${this.AZURE_OPENAI_ENDPOINT}/openai/deployments/${this.DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.AZURE_OPENAI_KEY,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 800,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze feedback");
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return analysis as AnalyzedFeedback;
    } catch (error) {
      console.error("Feedback analysis error:", error);
      throw error;
    }
  }

  async generateImprovedGuide(
    analyzedFeedback: AnalyzedFeedback,
    originalGuide: string,
    location: string
  ): Promise<string> {
    try {
      const prompt = `
현재 장소(${location})의 가이드 내용을 개선해주세요.

현재 가이드 내용:
${originalGuide}

피드백 분석 결과:
- 감정: ${analyzedFeedback.sentiment}
- 키워드: ${analyzedFeedback.keywords.join(", ")}
- 개선 필요 사항: ${analyzedFeedback.improvements.join(", ")}
- 요약: ${analyzedFeedback.summary}

위 피드백을 반영하여 다음 사항을 개선한 새로운 가이드 내용을 작성해주세요:
1. 사용자가 지적한 문제점 해결
2. 정보의 깊이와 범위 조정
3. 설명 방식과 톤 조정
4. 흥미로운 요소 추가

응답은 개선된 가이드 내용만 작성해주세요.`;

      const response = await fetch(
        `${this.AZURE_OPENAI_ENDPOINT}/openai/deployments/${this.DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.AZURE_OPENAI_KEY,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate improved guide");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Guide improvement error:", error);
      throw error;
    }
  }

  // 서버에 피드백 저장
  async saveFeedback(feedbackData: FeedbackData): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const userInfo = JSON.parse(userData);
      const formattedFeedbackData = {
        ...feedbackData,
        username: userInfo.username,
      };

      const response = await axios.post(
        `${BASE_URL}/feedback`,
        formattedFeedbackData
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Feedback save error:", error);
      throw error;
    }
  }

  // 서버에 개선된 가이드 저장
  async saveImprovedGuide(
    location: string,
    improvedGuide: string
  ): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const userInfo = JSON.parse(userData);
      const formattedGuideData = {
        username: userInfo.username,
        location,
        content: improvedGuide,
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(
        `${BASE_URL}/guides`,
        formattedGuideData
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Guide save error:", error);
      throw error;
    }
  }

  // 장소별 가이드 조회
  async getGuideByLocation(location: string): Promise<string | null> {
    try {
      const response = await axios.get(`${BASE_URL}/guides/${location}`);
      return response.data.content || null;
    } catch (error) {
      console.error("Guide fetch error:", error);
      return null;
    }
  }
}
