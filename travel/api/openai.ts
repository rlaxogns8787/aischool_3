import AsyncStorage from "@react-native-async-storage/async-storage";
// Azure OpenAI Configuration
export const AZURE_OPENAI_ENDPOINT = "https://ssapy-openai.openai.azure.com/";
export const AZURE_OPENAI_KEY =
  "65fEqo2qsGl8oJPg7lzs8ZJk7pUgdTEgEhUx2tvUsD2e07hbowbCJQQJ99BBACfhMk5XJ3w3AAABACOGr7S4";
export const DEPLOYMENT_NAME = "gpt-4o";

// Azure AI Search Configuration
export const AZURE_SEARCH_ENDPOINT =
  "https://ssapy-ai-search.search.windows.net";
export const AZURE_SEARCH_KEY =
  "NGZcgM1vjwqKoDNPnFXcApBFttxWmGRLmnukKldPcTAzSeBjHCk6";
export const ATTRACTION_INDEX = "add_food_index";

// 시스템 프롬프트 수정
const SYSTEM_PROMPT = `당신은 여행 계획을 도와주는 AI 어시스턴트입니다.

[초기 옵션 안내]
1번 옵션 - 처음부터 도와주기:
- 사용자의 선호도를 파악하여 맞춤형 일정 추천
- 여행 스타일, 목적지, 일정, 예산 등을 순차적으로 질문
- 수집된 정보를 바탕으로 최적의 일정 생성

2번 옵션 - 즉흥여행:
- 국내 주요 여행지 중 랜덤 선택
- 1~10일 사이의 랜덤 일정 생성
- 기본 여행 스타일과 예산 설정
- 자연스러운 동선과 현지 특색을 고려한 일정 구성

3번 옵션 - 기존 일정 등록:
- 사용자의 기존 일정을 경청하고 정리
- 일정 포맷에 맞춰 구조화
- 필요한 경우 세부 정보 요청

[일정 생성 가이드라인]
여행 일정 생성 시 다음 요소들을 고려해주세요:
1. 이동 동선의 효율성
2. 장소별 적정 체류 시간
3. 식사 시간대 고려
4. 계절/날씨에 따른 실내외 활동 배분
5. 교통수단별 이동 시간 계산

[장소 설명 가이드라인]
각 장소에 대한 설명은 다음 요소들을 포함하여 2줄 정도의 풍부한 설명을 제공해주세요:
1. 장소의 특징적인 분위기나 매력
2. 추천 활동이나 체험 요소
3. 유명한 포인트나 볼거리
4. 방문 시 특별히 고려할 사항이나 팁

설명 예시:
- 카페: "푸른 바다가 한 눈에 보이는 통유리창과 아늑한 우드톤 인테리어가 매력적인 오션뷰 카페입니다. 시그니처 메뉴인 말차 티라미수와 함께 2층 테라스에서 일몰을 감상하는 것을 추천드립니다."
- 관광지: "조선시대 양반가의 전통가옥을 그대로 보존한 한옥마을로, 좁은 골목길마다 운치있는 한옥들이 늘어서 있습니다. 한복을 입고 전통 다과를 즐기며 고즈넉한 정취를 만끽할 수 있으며, 저녁에는 은은한 조명이 더욱 로맨틱한 분위기를 자아냅니다."
- 맛집: "3대째 내려오는 전통 비법으로 만드는 국수 전문점으로, 쫄깃한 면발과 깊은 감칠맛이 일품인 멸치국수가 대표 메뉴입니다. 점심시간에는 대기 줄이 길어질 수 있으니 오전 11시 반 이전 방문을 추천드리며, 계절 한정 메뉴인 냉국수도 꼭 맛보세요."

[제목 생성 가이드라인]
여행 스타일과 목적지의 특징을 결합하여 감성적이고 창의적인 제목을 생성해주세요:
- 맛집/음식 테마: "구수한 향이 나는 먹거리 탐험", "미식가의 은밀한 맛집 순례", "맛있는 추억을 담는 여행"
- 자연/힐링 테마: "바다와 숲이 선물하는 쉼표", "자연이 들려주는 고요한 속삭임", "푸른 하늘 아래 찾는 평화"
- 문화/역사 테마: "시간을 거슬러 떠나는 문화 산책", "역사가 숨쉬는 골목길 산책", "과거와 현재가 만나는 여정"
- 액티비티 테마: "짜릿한 모험이 기다리는 여행", "활력이 넘치는 도전 여행", "설렘 가득한 액티비티 투어"
- 복합 테마: 여러 테마가 결합된 경우 각 특징을 조화롭게 표현
예시) 자연+맛집: "맛있는 휴식이 있는 자연 속 피크닉"`;

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
      `${AZURE_SEARCH_ENDPOINT}/indexes/${ATTRACTION_INDEX}/docs/search?api-version=2023-07-01-Preview`,
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
  const systemPrompt = `당신은 여행 일정을 생성해주는 AI 어시스턴트입니다. 
사용자의 선호도와 조건에 맞는 상세한 여행 일정을 JSON 형식으로 생성해주세요.

[제목 생성 가이드라인]
여행 스타일과 목적지의 특징을 결합하여 감성적이고 창의적인 제목을 생성해주세요.
- 맛집/음식 테마: "구수한 향이 나는 먹거리 탐험", "미식가의 은밀한 맛집 순례", "맛있는 추억을 담는 여행"
- 자연/힐링 테마: "바다와 숲이 선물하는 쉼표", "자연이 들려주는 고요한 속삭임", "푸른 하늘 아래 찾는 평화"
- 문화/역사 테마: "시간을 거슬러 떠나는 문화 산책", "역사가 숨쉬는 골목길 산책", "과거와 현재가 만나는 여정"
- 액티비티 테마: "짜릿한 모험이 기다리는 여행", "활력이 넘치는 도전 여행", "설렘 가득한 액티비티 투어"
- 복합 테마: 여러 테마가 결합된 경우 각 특징을 조화롭게 표현
예시) 자연+맛집: "맛있는 휴식이 있는 자연 속 피크닉"

[장소 설명 가이드라인]
각 장소에 대한 설명은 다음 요소들을 포함하여 2줄 정도의 풍부한 설명을 제공해주세요:
1. 장소의 특징적인 분위기나 매력
2. 추천 활동이나 체험 요소
3. 유명한 포인트나 볼거리
4. 방문 시 특별히 고려할 사항이나 팁

설명 예시:
- 카페: "푸른 바다가 한 눈에 보이는 통유리창과 아늑한 우드톤 인테리어가 매력적인 오션뷰 카페입니다. 시그니처 메뉴인 말차 티라미수와 함께 2층 테라스에서 일몰을 감상하는 것을 추천드립니다."
- 관광지: "조선시대 양반가의 전통가옥을 그대로 보존한 한옥마을로, 좁은 골목길마다 운치있는 한옥들이 늘어서 있습니다. 한복을 입고 전통 다과를 즐기며 고즈넉한 정취를 만끽할 수 있으며, 저녁에는 은은한 조명이 더욱 로맨틱한 분위기를 자아냅니다."
- 맛집: "3대째 내려오는 전통 비법으로 만드는 국수 전문점으로, 쫄깃한 면발과 깊은 감칠맛이 일품인 멸치국수가 대표 메뉴입니다. 점심시간에는 대기 줄이 길어질 수 있으니 오전 11시 반 이전 방문을 추천드리며, 계절 한정 메뉴인 냉국수도 꼭 맛보세요."

응답은 반드시 아래 형식을 따라야 합니다:
{
  "tripId": "고유ID",
  "timestamp": "생성시간",
  "title": "여행 테마에 맞는 제목",
  "companion": "동행인 정보",
  "startDate": "시작날짜",
  "endDate": "종료날짜", 
  "duration": "n박m일",
  "budget": "예산",
  "transportation": ["교통수단1", "교통수단2"],
  "keywords": ["키워드1", "키워드2"],
  "summary": "대표 코스 요약",
  "days": [
    {
      "dayIndex": 1,
      "date": "YYYY-MM-DD",
      "places": [
        {
          "order": 1,
          "time": "HH:MM",
          "title": "장소명",
          "description": "장소에 대한 2줄 설명",
          "duration": "소요시간",
          "address": "주소",
          "cost": 비용(숫자),
          "coords": {
            "lat": 위도,
            "lng": 경도
          }
        }
      ]
    }
  ],
  "extraInfo": {
    "estimatedCost": [
      { "type": "비용항목", "amount": 금액 }
    ],
    "totalCost": 총비용
  }
}`;

  const messages = [
    {
      role: "system",
      content: systemPrompt,
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

      위 조건에 맞는 여행 일정을 JSON 형식으로 생성해주세요.
      각 장소마다 예상 소요 시간, 입장료, 설명을 포함해주세요.
      응답은 반드시 파싱 가능한 JSON 형식이어야 합니다.`,
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
          max_tokens: 3000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate schedule");
    }

    const data = await response.json();
    const scheduleJson = JSON.parse(data.choices[0].message.content);

    // 원본 JSON 문자열 저장
    scheduleJson.generatedScheduleRaw = data.choices[0].message.content;

    // JSON을 가독성 좋은 텍스트로 변환
    const formatScheduleToText = (schedule: any) => {
      const formatCost = (cost: number) => cost.toLocaleString("ko-KR");

      let text = `[${schedule.title}]\n\n`;
      text += `▪️ 여행 기간: ${schedule.startDate} ~ ${schedule.endDate} (${schedule.duration})\n`;
      text += `▪️ 동행: ${schedule.companion}\n`;
      text += `▪️ 교통수단: ${schedule.transportation.join(", ")}\n`;
      text += `▪️ 예산: ${schedule.budget}\n`;
      text += `▪️ 여행 키워드: ${schedule.keywords.join(", ")}\n\n`;
      text += `📍 대표 코스: ${schedule.summary}\n\n`;

      // 일자별 일정
      schedule.days.forEach((day: any) => {
        text += `=== ${day.date} (${day.dayIndex}일차) ===\n\n`;

        day.places.forEach((place: any) => {
          text += `⏰ ${place.time} ${place.title}\n`;
          text += `   • ${place.description}\n`;
          text += `   • 소요시간: ${place.duration}\n`;
          text += `   • 주소: ${place.address}\n`;
          if (place.cost > 0) {
            text += `   • 비용: ${formatCost(place.cost)}원\n`;
          }
          text += "\n";
        });
      });

      // 예상 비용 정보
      text += "=== 예상 비용 내역 ===\n\n";
      schedule.extraInfo.estimatedCost.forEach((cost: any) => {
        text += `• ${cost.type}: ${formatCost(cost.amount)}원\n`;
      });
      text += `\n총 예상 비용: ${formatCost(schedule.extraInfo.totalCost)}원`;

      return text;
    };
    // AsyncStorage에 저장
    try {
      await AsyncStorage.setItem(
        "formattedSchedule",
        JSON.stringify(scheduleJson)
      );
      console.log("일정이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("일정 저장 중 오류 발생:", error);
    }

    //   // 저장된 데이터를 로그로 출력
    //   const storedData = await AsyncStorage.getItem("formattedSchedule");
    //   console.log("저장된 일정 데이터:", storedData);
    // } catch (error) {
    //   console.error("일정 저장 중 오류 발생:", error);
    // }

    // JSON 원본은 저장하고, 텍스트 형식으로 변환하여 반환
    return formatScheduleToText(scheduleJson);
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};
