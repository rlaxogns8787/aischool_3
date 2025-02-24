// interestUtils.ts

// 1) 관심사별 키워드 사전
const keywordMappings: Record<string, string[]> = {
  역사: [
    "유적",
    "고궁",
    "성곽",
    "사적지",
    "박물관",
    "전통",
    "왕조",
    "역사",
    "고대 유물",
    "문화재",
    "조선시대",
    "신라",
    "고구려",
    "백제",
    "근대사",
    "독립운동",
    "전쟁 역사",
  ],
  문화: [
    "축제",
    "전통",
    "공연",
    "문화재",
    "지역 문화",
    "행사",
    "유적지",
    "페스티벌",
    "문화 축제",
    "테마파크",
    "전통 의상",
    "한복 체험",
    "민속촌",
    "공예 체험",
  ],
  예술: [
    "예술",
    "미술",
    "음악",
    "공연",
    "전시",
    "갤러리",
    "박물관",
    "조각",
    "설치 미술",
    "현대 예술",
    "공예",
    "디자인",
    "퍼포먼스",
    "창작",
  ],
  디자인: [
    "디자인",
    "그래픽",
    "건축",
    "인테리어",
    "패션",
    "산업 디자인",
    "시각 디자인",
    "제품 디자인",
    "디자이너",
    "전시",
    "스튜디오",
    "아트센터",
  ],
  건축: [
    "건물",
    "성",
    "궁",
    "타워",
    "다리",
    "건축",
    "구조물",
    "도시계획",
    "역사적 건축물",
    "전통 건축",
    "현대 건축",
    "스카이라인",
    "지붕",
    "아치",
    "고딕 건축",
    "유럽풍 건축",
    "초고층 빌딩",
    "전통 한옥",
  ],
  음악: [
    "공연",
    "음악",
    "콘서트",
    "버스킹",
    "무대",
    "연주",
    "페스티벌",
    "재즈",
    "클래식",
    "힙합",
    "록",
    "EDM",
    "K-POP",
    "DJ",
    "오케스트라",
    "스트리트 공연",
    "합창단",
  ],
  공연: [
    "뮤지컬",
    "연극",
    "오페라",
    "콘서트",
    "무용",
    "전통 공연",
    "서커스",
    "스트리트 공연",
    "퍼포먼스 아트",
    "쇼케이스",
    "공연장",
    "즉흥 연기",
    "극단",
  ],
  "K-POP": [
    "아이돌",
    "한류",
    "팬미팅",
    "댄스",
    "음악 방송",
    "콘서트",
    "스타디움",
    "팬덤",
    "K-POP 공연",
    "연습생",
    "보이그룹",
    "걸그룹",
    "서바이벌 프로그램",
  ],
  엔터테인먼트: [
    "영화",
    "드라마",
    "놀이공원",
    "테마파크",
    "방송국",
    "게임",
    "e스포츠",
    "애니메이션",
    "코미디",
    "토크쇼",
    "아케이드",
    "넷플릭스 촬영지",
  ],
  문학: [
    "도서관",
    "책방",
    "서점",
    "시인",
    "소설",
    "문학관",
    "작가",
    "독서",
    "시집",
    "SF소설",
    "판타지",
    "추리소설",
    "고전문학",
    "서재",
    "북페어",
  ],
  과학: [
    "과학관",
    "천문대",
    "실험",
    "발명",
    "기술",
    "공학",
    "연구소",
    "로봇",
    "AI",
    "우주",
    "천체 망원경",
    "양자 물리학",
    "생물학",
    "수학",
    "코딩",
  ],
  수학: [
    "수학",
    "과학관",
    "연구소",
    "통계",
    "기하학",
    "수리 과학",
    "수학 박물관",
    "계산",
    "논리학",
    "암호학",
    "수학 체험관",
  ],
  기술: [
    "기술",
    "과학",
    "IT",
    "컴퓨터",
    "로봇",
    "AI",
    "VR",
    "AR",
    "드론",
    "스마트 기기",
    "첨단 기술",
    "연구소",
    "혁신 센터",
  ],
  경제: [
    "금융",
    "증권",
    "은행",
    "경제",
    "시장",
    "상업",
    "무역",
    "기업",
    "창업",
    "투자",
    "비즈니스",
    "증권거래소",
    "상공회의소",
  ],
  스포츠: [
    "경기장",
    "체육관",
    "야구",
    "축구",
    "농구",
    "올림픽",
    "운동",
    "체험 스포츠",
    "익스트림 스포츠",
    "서핑",
    "스노보드",
    "스케이트보드",
    "마라톤",
    "암벽 등반",
  ],
  자동차: [
    "레이싱",
    "전시장",
    "자동차 박물관",
    "모터쇼",
    "튜닝",
    "전기차",
    "스포츠카",
    "클래식카",
    "드래그 레이싱",
    "자동차 경주",
    "바이크",
    "F1",
  ],
  요리: [
    "음식",
    "맛집",
    "식당",
    "카페",
    "레스토랑",
    "먹거리",
    "푸드코트",
    "요리 체험",
    "길거리 음식",
    "전통 음식",
    "한식",
    "양식",
    "일식",
    "중식",
    "디저트",
    "미슐랭",
    "베이커리",
    "수제 맥주",
    "전통주",
  ],
  음식: [
    "맛집",
    "식당",
    "카페",
    "레스토랑",
    "먹거리",
    "푸드코트",
    "음식점",
    "전통 시장",
    "야시장",
    "푸드트럭",
    "디저트",
    "베이커리",
    "음식 축제",
    "미식",
  ],
  패션: [
    "쇼핑몰",
    "디자이너",
    "패션위크",
    "의류",
    "악세사리",
    "브랜드",
    "스타일",
    "패션 잡지",
    "스트릿 패션",
    "명품 브랜드",
    "빈티지 샵",
    "패션 트렌드",
  ],
};

// 2) "장소 정보"를 분석하여 가장 잘 맞는 '관심사'를 찾아주는 함수
export function findMatchingInterest(
  placeTitle: string,
  placeDescription: string,
  userInterests: string[]
): string {
  console.log("🔍 [InterestUtils] 관심사 매칭 시작");
  console.log("📍 장소:", placeTitle);
  console.log("📝 설명:", placeDescription);
  console.log("👤 사용자 관심사:", userInterests);

  // 기본값: userInterests가 비어있으면 '전체' 사용
  if (!userInterests.length) {
    console.log("✨ 선택된 관심사 없음 -> '전체' 모드로 진행");
    return "전체";
  }

  // 우선순위: userInterests 중 첫 번째가 "전체"면 뒤 로직 통과
  if (userInterests[0] === "전체") {
    console.log("✨ '전체' 모드로 진행");
    return "전체";
  }

  // placeInfo 소문자로 전처리
  const placeInfo = `${placeTitle} ${placeDescription}`.toLowerCase();

  // 사용자 관심사 여러 개인 경우:
  if (userInterests.length > 1) {
    console.log("📊 다중 관심사 매칭 시도");
    const matchingPreferences = userInterests.filter((pref) => {
      const keywords = keywordMappings[pref] || [];
      // 관심사 자체가 placeInfo에 등장하거나,
      // 미리 지정한 키워드가 placeInfo 안에 있으면 매칭
      const isMatching =
        placeInfo.includes(pref.toLowerCase()) ||
        keywords.some((kw) => placeInfo.includes(kw));

      if (isMatching) {
        console.log(`✅ 매칭된 관심사: ${pref}`);
        console.log(
          `🔑 매칭된 키워드:`,
          keywords.filter((kw) => placeInfo.includes(kw))
        );
      }

      return isMatching;
    });

    // 매칭된 관심사가 하나 이상 있으면 랜덤으로 하나 선택
    if (matchingPreferences.length > 0) {
      const selectedPreference =
        matchingPreferences[
          Math.floor(Math.random() * matchingPreferences.length)
        ];
      console.log(`🎯 최종 선택된 관심사: ${selectedPreference}`);
      return selectedPreference;
    } else {
      // 아무것도 안 맞으면 userInterests 중에서 랜덤
      const randomPreference =
        userInterests[Math.floor(Math.random() * userInterests.length)];
      console.log(`🎲 매칭 실패 -> 랜덤 선택: ${randomPreference}`);
      return randomPreference;
    }
  } else {
    // 단일 관심사인 경우 해당 관심사 사용
    console.log(`🎯 단일 관심사 사용: ${userInterests[0]}`);
    return userInterests[0];
  }
}
