// Azure OpenAI 설정
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// Azure Search 설정
const AZURE_SEARCH_ENDPOINT = "https://ssapy-search.search.windows.net";
const AZURE_SEARCH_KEY = "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa";
const AZURE_SEARCH_INDEX = "travel-index";

// 시스템 프롬프트 정의
const SYSTEM_PROMPT = `당신은 여행 계획을 도와주는 AI 어시스턴트입니다.

사용자의 질문 유형에 따라 다음과 같은 형식으로 답변해주세요:

1. 여행지 추천 요청의 경우:
   - 여행 목적에 맞는 2-3곳 추천
   - 각 장소의 특징과 매력 포인트
   - 방문하기 좋은 시기
   - 예상 소요 시간

2. 일정 계획 요청의 경우:
   - 일자별 코스 제안
   - 각 장소당 추천 체류 시간
   - 이동 방법과 소요 시간
   - 예상 비용

3. 맛집 추천 요청의 경우:
   - 유명 맛집 2-3곳 추천
   - 각 식당의 대표 메뉴
   - 가격대
   - 예약 필요 여부

4. 숙소 추천 요청의 경우:
   - 지역별 추천 숙소 2-3곳
   - 숙소 유형과 특징
   - 가격대
   - 주변 편의시설

답변 시 주의사항:
1. 항상 친근하고 자연스러운 한국어로 답변해주세요.
2. 구체적인 정보와 함께 실용적인 조언을 제공해주세요.
3. 여행자의 편의를 최우선으로 고려해주세요.
4. 모든 정보는 하나의 통합된 답변으로 자연스럽게 작성해주세요.

선택 옵션이 필요한 경우 다음과 같이 제시해주세요:
예시) 어떤 스타일의 여행을 선호하시나요?
1) 자연/힐링
2) 문화/역사
3) 맛집/쇼핑
4) 액티비티/체험`;

export const chatWithAI = async (input: string): Promise<string> => {
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
      max_tokens: 1000, // 토큰 수 증가
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const result = await response.json();

    if (!result.choices || result.choices.length === 0) {
      throw new Error("No response from AI");
    }

    return (
      result.choices[0].message?.content ||
      "죄송합니다. 응답을 생성하지 못했습니다."
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
};
