class ChatBot {
  async sendInitialOptions(context) {
    const options = `음성인식 중입니다. 말을 하면 자동 입력됩니다. 지금 말을 하기 어려운 상황이라면 아래 입력창을 이용해주세요.

먼저 진행하기전에 아래 두 옵션 중 하나를 선택을 해주세요:

1. 저는 이미 생각한 여행일정 있어요.
2. 여행은 가고싶지만 처음부터 도와주세요.`;

    return await context.sendActivity({
      type: "message",
      text: options,
    });
  }

  async run(context) {
    try {
      const userText = context.activity.text.toLowerCase();
      let responseText = "";

      // 1번 옵션 관련 다양한 입력 처리
      if (
        userText.includes("1") ||
        userText.includes("일정") ||
        userText.includes("이미") ||
        userText.includes("있어") ||
        userText.includes("첫번째") ||
        userText.includes("1번")
      ) {
        responseText = "어떤 지역으로 여행을 계획하고 계신가요?";
      }
      // 2번 옵션 관련 다양한 입력 처리
      else if (
        userText.includes("2") ||
        userText.includes("처음") ||
        userText.includes("도와") ||
        userText.includes("두번째") ||
        userText.includes("2번")
      ) {
        responseText =
          "좋습니다. 함께 여행 계획을 세워보아요. 먼저, 어떤 지역으로 여행을 가고 싶으신가요?";
      }
      // 지역 선택 후 처리
      else if (userText.includes("서울")) {
        responseText =
          "서울로 정하셨군요! 여행 기간은 어떻게 되시나요? (예: 2박 3일)";
      } else if (userText.includes("2박")) {
        responseText = "1박2일";
      } else {
        responseText = "죄송합니다. 1번 또는 2번 중에서 선택해주세요.";
      }

      return {
        type: "message",
        text: responseText,
      };
    } catch (error) {
      console.error("Error in ChatBot.run:", error);
      return {
        type: "message",
        text: "죄송합니다. 처리 중 오류가 발생했습니다.",
      };
    }
  }
}

module.exports = ChatBot;
