export type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: Option[];
  questions?: string[]; // 여러 질문을 표시하기 위한 배열
  searchResults?: SearchResult[]; // AI Search 결과
};

export type Option = {
  text: string;
  value: string;
};
