export const INITIAL_MESSAGE = {
  id: "1",
  text: `안녕하세요! 저는 여행 계획을 도와주는 AI 어시스턴트입니다.

먼저 진행하기전에 아래 세 옵션 중 하나를 선택을 해주세요. 여행을 염두하고 계시지만 어떻게 시작해야할 지 몰라 저와 함께 처음부터 같이 진행하고 싶다면 1번, 즉흥여행을 떠나고 싶다면 2번, 이미 어느정도 정해진 일정이 있다면 3번을 선택해주세요.`,
  isBot: true,
  timestamp: new Date().toISOString(),
  options: [
    { text: "여행은 가고싶지만 처음부터 도와주세요", value: 1 },
    { text: "막연하지만 즉흥여행 떠날래요", value: 2 },
    { text: "이미 여행일정 어느정도 계획되어 있어요", value: 3 },
  ],
};

export const COMPANION_OPTIONS = [
  { text: "1. 혼자", value: 1 },
  { text: "2. 친구와 함께", value: 2 },
  { text: "3. 가족과 함께", value: 3 },
  { text: "4. 부모님과 함께", value: 4 },
  { text: "5. 연인과 함께", value: 5 },
];
