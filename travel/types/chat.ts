export type MessageOption = {
  text: string;
  value: number;
  selected?: boolean;
};

export type StyleOption = {
  text: string;
  value: string;
  selected: boolean;
};

export type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: MessageOption[];
  styleOptions?: StyleOption[];
  isLoading?: boolean;
};
export type TripInfo = {
  styles: string[] | undefined; // 여행 스타일을 나타내는 문자열 배열입니다. 예: ["자연/힐링", "문화/역사"]
  destination: string | undefined; // 여행 목적지입니다. 예: "서울"
  startDate: Date | null; // 여행 시작 날짜입니다. 예: new Date("2025-02-15")
  endDate: Date | null; // 여행 종료 날짜입니다. 예: new Date("2025-02-20")
  duration: string; // 여행 기간을 나타내는 문자열입니다. 예: "5박 6일"
  nights: number; // 여행 기간 중 숙박 일수를 나타내는 숫자입니다. 예: 5
  days: number; // 여행 기간 중 일수를 나타내는 숫자입니다. 예: 6
  companion: string | undefined; // 여행 동반자 정보를 나타내는 문자열입니다. 예: "친구"
  budget: string | undefined; // 여행 예산을 나타내는 문자열입니다. 예: "100만원"
  transportation: string[]; // 선호하는 교통수단을 나타내는 문자열 배열입니다. 예: ["기차", "버스"]
};
