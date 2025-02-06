import { useState } from "react";
import { SearchResult, Schedule } from "../types/azure";

// 환경변수를 직접 사용
const AZURE_ENDPOINTS = {
  search: "https://ssapy-search.search.windows.net",
  openai:
    "https://ssapy-openai.openai.azure.com/openai/deployments/ssapy-openai/chat/completions?api-version=2024-02-15-preview",
};

const AZURE_KEYS = {
  search: "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa",
  openai:
    "AdUzyU0yj12b5DMUqoABiwtYMiinFxzYtV6t2bfUR4gLVst0hU9eJQQJ99BAACfhMk5XJ3w3AAABACOGiK4S",
};

export function useAzureServices() {
  const [isLoading, setIsLoading] = useState(false);

  const searchDestinations = async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `${AZURE_ENDPOINTS.search}/indexes/travel-destinations/docs/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_KEYS.search,
          },
          body: JSON.stringify({
            search: query,
            select: "id,name,description,type,imageUrl,location,rating,reviews",
            top: 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  };

  const generateSchedule = async (travelInfo: any): Promise<Schedule> => {
    try {
      setIsLoading(true);
      const response = await fetch(AZURE_ENDPOINTS.openai, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_KEYS.openai,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `당신은 여행 전문가입니다. 다음 형식으로 여행 일정을 생성해주세요:
                {
                  "title": "여행 제목",
                  "destination": "여행지",
                  "startDate": "시작일",
                  "endDate": "종료일",
                  "activities": [
                    {
                      "day": 1,
                      "items": [
                        {
                          "time": "09:00",
                          "activity": "활동명",
                          "location": "장소",
                          "description": "설명",
                          "cost": 예상비용
                        }
                      ]
                    }
                  ],
                  "totalBudget": 총예산
                }`,
            },
            {
              role: "user",
              content: `다음 조건으로 여행 일정을 만들어주세요:
                목적지: ${travelInfo.destination}
                기간: ${travelInfo.dates?.start} - ${travelInfo.dates?.end}
                인원: ${travelInfo.people}명
                동반자: ${travelInfo.companions}
                선호활동: ${travelInfo.activities?.join(", ")}
                예산: ${travelInfo.budget}원`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Schedule generation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchDestinations,
    generateSchedule,
    isLoading,
  };
}
