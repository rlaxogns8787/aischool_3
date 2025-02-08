// Azure OpenAI 설정
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// Azure Search 설정
const AZURE_SEARCH_ENDPOINT = "https://ssapy-search.search.windows.net";
const AZURE_SEARCH_KEY = "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa";
const AZURE_SEARCH_INDEX = "final-index";

// 시스템 프롬프트 수정
const SYSTEM_PROMPT = `당신은 여행 계획을 도와주는 AI 어시스턴트입니다.

[1번 옵션 - 기존 일정 등록]
사용자가 이미 계획한 일정이 있는 경우:
- 사용자의 일정을 경청하고 정리
- 추가 요청이 없다면 바로 일정 등록 진행
- 응답 예시: "일정에 대해 말씀해 주시면 등록해드리겠습니다."

[2번 옵션 - 맞춤 일정 추천]
사용자가 도움이 필요한 경우 아래 순서로 정보를 수집:
1. 선호하는 여행 스타일을 선택해주세요:
   1) 자연/힐링
   2) 문화/역사
   3) 맛집/쇼핑
   4) 액티비티/체험

2. 희망하시는 국내 여행지가 있으신가요?

3. 여행 일정:
   - 희망하는 출발 날짜
   - 여행 기간

4. 여행 인원:
   - 인원 수
   - 동행자 정보 (있는 경우)
   - 단체인 경우 도슨트 필요 여부

5. 예상 여행 예산

6. 선호하는 교통수단

각 질문은 하나씩 순차적으로 진행하며, 이전 답변을 고려하여 다음 질문을 합니다.
날짜가 불명확한 경우 날씨 데이터를 참고하여 최적의 시기를 추천합니다.`;

export const chatWithAI = async (
  input: string,
  retries = 3
): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      const requestBody = {
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: input,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
      };

      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
          },
          body: JSON.stringify(requestBody),
          timeout: 30000, // 30초 타임아웃 설정
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status}`, errorText);
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      if (!result.choices || result.choices.length === 0) {
        throw new Error("AI 응답이 없습니다.");
      }

      return (
        result.choices[0].message?.content || "응답을 생성하지 못했습니다."
      );
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        throw new Error("여러 번의 시도 후에도 연결에 실패했습니다.");
      }
      // 재시도 전 대기 시간을 점진적으로 증가
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  throw new Error("네트워크 연결에 실패했습니다.");
};

// Azure Search를 활용한 여행 정보 검색 함수 추가
const searchTravelInfo = async (searchQuery: string) => {
  try {
    const response = await fetch(
      `${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX}/docs/search?api-version=2023-07-01-Preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_SEARCH_KEY,
        },
        body: JSON.stringify({
          search: searchQuery,
          select: "title, content, category",
          queryType: "semantic",
          semanticConfiguration: "default",
          top: 5,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Search API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.value;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// 일정 생성을 위한 함수 수정
import { TripInfo } from "../types/chat";

export const generateTravelSchedule = async (tripInfo: TripInfo) => {
  const messages = [
    {
      role: "system",
      content:
        "당신은 여행 일정을 생성해주는 AI 어시스턴트입니다. 사용자의 선호도와 조건에 맞는 상세한 여행 일정을 생성해주세요.",
    },
    {
      role: "user",
      content: `
여행 스타일: ${tripInfo.styles?.join(", ")}
여행 지역: ${tripInfo.destination}
여행 기간: ${tripInfo.duration}
여행 인원: ${tripInfo.companion}
예산: ${tripInfo.budget}
교통수단: ${tripInfo.transportation?.join(", ")}

위 조건에 맞는 여행 일정을 생성해주세요. 각 장소마다 예상 소요 시간, 입장료, 설명을 포함해주세요.`,
    },
  ];

  try {
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          messages,
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate schedule");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};
