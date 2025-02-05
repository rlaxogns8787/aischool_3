import { Configuration } from "azure-rest-api-specs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SearchResult {
  content: string;
  metadata?: {
    location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export class AzureService {
  private searchEndpoint: string;
  private searchKey: string;
  private openaiEndpoint: string;
  private openaiKey: string;
  private speechEndpoint: string;
  private speechKey: string;

  constructor() {
    this.searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT!;
    this.searchKey = process.env.AZURE_SEARCH_KEY!;
    this.openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    this.openaiKey = process.env.AZURE_OPENAI_KEY!;
    this.speechEndpoint = `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/`;
    this.speechKey = process.env.AZURE_SPEECH_KEY!;
  }

  // Azure AI Search를 사용한 여행 정보 검색
  async searchTourInfo(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${this.searchEndpoint}/indexes/tour-info/docs/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.searchKey,
          },
          body: JSON.stringify({
            search: query,
            select: "content,location,coordinates",
            queryType: "semantic",
            semanticConfiguration: "default",
            top: 3,
          }),
        }
      );

      if (!response.ok) throw new Error("Search request failed");
      const data = await response.json();
      return data.value.map((doc: any) => ({
        content: doc.content,
        metadata: {
          location: doc.location,
          coordinates: doc.coordinates,
        },
      }));
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  // Azure OpenAI를 사용한 챗봇 응답 생성
  async getChatCompletion(
    messages: ChatMessage[],
    context?: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.openaiEndpoint}/openai/deployments/ssapy-openai/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.openaiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "당신은 한국어로 응답하는 여행 가이드 AI입니다.",
              },
              ...messages,
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) throw new Error("Chat completion request failed");
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Chat completion error:", error);
      throw error;
    }
  }
}
