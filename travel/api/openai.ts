// Azure OpenAI 설정
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// Azure Search 설정
const AZURE_SEARCH_ENDPOINT = "https://ssapy-search.search.windows.net";
const AZURE_SEARCH_KEY = "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa";
const AZURE_SEARCH_INDEX = "travel-index";

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
