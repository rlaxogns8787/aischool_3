import { useState } from "react";
import { SearchResult, Schedule, TravelInfo } from "../types/schedule";

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
        `${AZURE_ENDPOINTS.search}/indexes/spot-merged-data/docs/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_KEYS.search,
          },
          body: JSON.stringify({
            search: query,
            select:
              "id,name,description,type,imageUrl,location,rating,reviews,category,keywords",
            top: 5,
            queryType: "full",
            searchFields: ["name", "description", "keywords", "category"],
            filter: "type eq 'spot'",
            orderby: "rating desc",
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

  const generateSchedule = async (
    travelInfo: TravelInfo
  ): Promise<Schedule> => {
    try {
      setIsLoading(true);

      // 1. 먼저 사용자의 이전 여행 경험을 분석
      const experienceAnalysis = await fetch(AZURE_ENDPOINTS.openai, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_KEYS.openai,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `chatkorea.json 데이터를 참조하여 사용자의 여행 경험을 분석하고, 
              유사한 선호도를 가진 장소들을 추천해주세요. 다음 정보를 추출해주세요:
              - 선호하는 장소 유형
              - 주요 키워드
              - 관심 카테고리`,
            },
            {
              role: "user",
              content: `이전 여행 경험: ${travelInfo.previousExperience}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const analysisData = await experienceAnalysis.json();
      const preferences = JSON.parse(analysisData.choices[0].message.content);

      // 2. 분석된 선호도를 기반으로 spot_merged_data에서 장소 검색
      const spotSearchResponse = await searchDestinations(
        `${preferences.keywords.join(" ")} ${travelInfo.destination}`
      );

      // 3. 최종 일정 생성
      const scheduleResponse = await fetch(AZURE_ENDPOINTS.openai, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_KEYS.openai,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `당신은 여행 전문가입니다. 사용자의 선호도와 검색된 장소들을 바탕으로 최적의 여행 일정을 만들어주세요.
              응답은 다음 JSON 형식을 따라주세요:
              {
                "title": "여행 제목",
                "destination": "여행지",
                "activities": [
                  {
                    "day": 1,
                    "items": [
                      {
                        "time": "09:00",
                        "activity": "활동명",
                        "location": "장소",
                        "description": "설명",
                        "cost": 예상비용,
                        "transportation": "이동수단"
                      }
                    ]
                  }
                ],
                "totalBudget": 총예산,
                "travelStyle": "여행 스타일 키워드",
                "guideService": true/false
              }`,
            },
            {
              role: "user",
              content: `다음 조건으로 여행 일정을 만들어주세요:
                분석된 선호도: ${JSON.stringify(preferences)}
                검색된 장소들: ${JSON.stringify(spotSearchResponse)}
                여행 기간: ${travelInfo.dates?.start} - ${travelInfo.dates?.end}
                인원: ${travelInfo.people}명
                동행 여부: ${travelInfo.companions}
                도슨트 서비스: ${travelInfo.guideNeeded ? "필요" : "불필요"}
                예산: ${travelInfo.budget}원
                선호 교통 수단: ${travelInfo.transportationType}
                추가 요청사항: ${travelInfo.additionalRequests || "없음"}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
      });

      const scheduleData = await scheduleResponse.json();
      return JSON.parse(scheduleData.choices[0].message.content);
    } catch (error) {
      console.error("Schedule generation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // chatkorea.json 분석 함수 추가
  const analyzeExperience = async (experience: string) => {
    try {
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
              content: `chatkorea.json의 response_mapping을 참조하여 사용자의 여행 경험을 분석하세요. 
              다음 정보를 추출해주세요:
              {
                "keywords": ["키워드1", "키워드2"],
                "interests": ["관심사1", "관심사2"],
                "recommendedActivities": ["활동1", "활동2"],
                "recommendedDestinations": ["장소1", "장소2"]
              }`,
            },
            {
              role: "user",
              content: experience,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Experience analysis error:", error);
      throw error;
    }
  };

  return {
    searchDestinations,
    generateSchedule,
    isLoading,
    analyzeExperience,
  };
}
