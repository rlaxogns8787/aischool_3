export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const extractTripInfo = (
  messages: Message[],
  selectedStyles: string[]
) => {
  const startDateMsg = messages
    .find((msg) => msg.text.includes("에 출발하는 여행이군요"))
    ?.text.match(/(\d{4}-\d{2}-\d{2})/)?.[0];

  return {
    styles: messages
      .find((msg) => msg.text.includes("을(를) 선택하셨네요"))
      ?.text.split("을(를) 선택하셨네요")[0]
      .split(", "),
    destination: messages
      .find((msg) => msg.text.includes("로 여행을 계획하시는군요"))
      ?.text.split("로 여행을")[0],
    startDate: startDateMsg,
    duration: messages
      .find((msg) => msg.text.includes("여행을 계획하시는군요"))
      ?.text.split("부터 ")[1]
      ?.split(" 여행을")[0],
    companion: messages
      .find((msg) => msg.text.includes("여행을 준비하겠습니다"))
      ?.text.split(" 여행을")[0],
    budget: messages
      .find((msg) => msg.text.includes("예산을"))
      ?.text.split("예산을 ")[1]
      ?.split("으로 설정")[0],
    transportation:
      messages
        .find((msg) => msg.text.includes("선호하는 교통수단을 선택해주세요"))
        ?.styleOptions?.filter((opt) => opt.selected)
        .map((opt) => opt.text) || [],
  };
};
