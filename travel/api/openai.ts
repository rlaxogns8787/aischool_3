// Azure OpenAI 설정
const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
const DEPLOYMENT_NAME = "gpt-4o";

// Azure Search 설정
const AZURE_SEARCH_ENDPOINT = "https://ssapy-search.search.windows.net";
const AZURE_SEARCH_KEY = "s6d0odfWQpmQh1HpjXELLBbrq1blnEvtGOncvWqMNyAzSeA2zxTa";
const AZURE_SEARCH_INDEX = "travel-index";

export const chatWithAI = async (input: string): Promise<string> => {
  try {
    // API 요청 구성
    const requestBody = {
      messages: [
        {
          role: "system",
          content:
            "당신은 여행 가이드 챗봇입니다. 다음과 같은 형식으로 답변해주세요:\n1. 여행지 추천\n2. 주요 관광지\n3. 예상 소요 시간\n4. 교통 정보\n5. 예상 비용",
        },
        {
          role: "user",
          content: input,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
    };

    // API 호출
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
