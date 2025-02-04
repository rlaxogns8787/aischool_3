const restify = require("restify");
const {
  BotFrameworkAdapter,
  MemoryStorage,
  ConversationState,
  UserState,
} = require("botbuilder");
require("dotenv").config(); // .env 파일 로드
const ChatBot = require("./ChatBot");
const express = require("express");
const multer = require("multer");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

// 서버와 상태 관리 설정
const server = restify.createServer();
const PORT = process.env.port || 3978;

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// 에러 핸들링 추가
const onTurnErrorHandler = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);
  await context.sendActivity("죄송합니다. 오류가 발생했습니다.");
  await context.sendActivity("다시 시도해 주세요.");
};

// 어댑터 설정 수정
const adapter = new BotFrameworkAdapter({
  appId: "", // 로컬 테스트를 위해 빈 문자열로 설정
  appPassword: "", // 로컬 테스트를 위해 빈 문자열로 설정
});

adapter.onTurnError = onTurnErrorHandler;

// 상단에 JSON 데이터 추가
const travelRecommendations = {
  response_mapping: [
    // ... 기존 JSON 데이터 ...
  ],
};

// 음성 파일 업로드를 위한 multer 설정
const upload = multer({ dest: "uploads/" });

// CORS 미들웨어 설정
server.use(function crossOrigin(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  return next();
});

// multer 미들웨어 설정
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// 음성을 텍스트로 변환하는 엔드포인트
server.post("/api/speech-to-text", upload.single("audio"), async (req, res) => {
  try {
    console.log("Starting speech recognition...");
    console.log("Speech key length:", process.env.SPEECH_KEY?.length);
    console.log("Speech region:", process.env.SPEECH_REGION);

    if (!req.files || !req.files.audio) {
      console.error("No audio file received");
      return res.send(400, { error: "No audio file received" });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY,
      process.env.SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = "ko-KR";
    console.log("Speech config created");

    const audioConfig = sdk.AudioConfig.fromWavFileInput(req.files.audio.path);
    console.log("Audio config created, file path:", req.files.audio.path);

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    console.log("Speech recognizer created");

    recognizer.recognizeOnceAsync(
      (result) => {
        console.log("Recognition result:", result.text);
        res.send(200, { text: result.text });
      },
      (error) => {
        console.error("Recognition error:", error);
        res.send(500, { error: "Failed to convert speech to text" });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.send(500, { error: "Server error" });
  }
});

// 여행 계획 봇
class TravelPlannerBot {
  constructor(conversationState, userState) {
    this.conversationState = conversationState;
    this.userState = userState;
  }

  // 여행 스타일에 맞는 추천 장소 찾기
  findRecommendations(style) {
    const recommendations = travelRecommendations.response_mapping.filter(
      (item) =>
        item.interests.some((interest) =>
          interest.toLowerCase().includes(style.toLowerCase())
        )
    );

    if (recommendations.length > 0) {
      const destinations = recommendations
        .flatMap((r) => r.recommended_destinations)
        .slice(0, 5); // 상위 5개 장소만 추천
      return destinations;
    }
    return [];
  }

  async onTurn(context) {
    if (context.activity.type === "message") {
      const userInput = context.activity.text;

      // 사용자 상태 가져오기
      const userStateAccessor =
        this.userState.createProperty("TravelPreferences");
      const userProfile = await userStateAccessor.get(context, {
        planningStage: "initial",
        preferences: {},
      });

      if (userProfile.planningStage === "initial") {
        if (userInput === "1" || userInput.includes("이미")) {
          userProfile.planningStage = "existing_plan";
          await context.sendActivity(
            "좋습니다! 기존 여행 일정을 등록해주세요. 어느 지역으로 여행을 계획하셨나요?"
          );
        } else if (userInput === "2" || userInput.includes("처음부터")) {
          userProfile.planningStage = "new_plan";
          await context.sendActivity(
            "어떤 스타일의 여행을 선호하시나요? (예: 문화탐방, 자연관광, 맛집탐방 등)"
          );
        } else {
          await this.sendInitialOptions(context);
        }
      } else if (userProfile.planningStage === "existing_plan") {
        userProfile.preferences.destination = userInput;
        await context.sendActivity(
          `${userInput} 여행을 계획하셨군요! 여행 일정은 어떻게 되시나요? (예: 3박 4일)`
        );
        userProfile.planningStage = "duration";
      } else if (userProfile.planningStage === "duration") {
        userProfile.preferences.duration = userInput;
        await context.sendActivity(
          "여행 일정을 받았습니다. 상세한 일정을 공유해주시면 최적의 가이드를 제공해드리겠습니다."
        );
        userProfile.planningStage = "details";
      } else if (userProfile.planningStage === "new_plan") {
        userProfile.preferences.style = userInput;
        const recommendations = this.findRecommendations(userInput);

        let responseMessage = `${userInput} 스타일의 여행을 좋아하시는군요!\n\n`;

        if (recommendations.length > 0) {
          responseMessage +=
            "추천 여행지:\n" +
            recommendations
              .map((dest, index) => `${index + 1}. ${dest}`)
              .join("\n") +
            "\n\n";
        }

        responseMessage += "이 중에서 어느 지역으로 여행을 가고 싶으신가요?";

        await context.sendActivity(responseMessage);
        userProfile.planningStage = "destination";
      } else if (userProfile.planningStage === "destination") {
        userProfile.preferences.destination = userInput;
        await context.sendActivity(
          `${userInput}로 정하셨군요! 여행 기간은 어떻게 되시나요? (예: 2박 3일)`
        );
        userProfile.planningStage = "duration";
      } else if (userProfile.planningStage === "duration") {
        userProfile.preferences.duration = userInput;

        // 선택한 정보 요약
        const summary =
          `지금까지 선택하신 내용입니다:\n\n` +
          `여행 스타일: ${userProfile.preferences.style}\n` +
          `여행지: ${userProfile.preferences.destination}\n` +
          `기간: ${userProfile.preferences.duration}\n\n` +
          `이제 상세한 일정을 계획해드리겠습니다. 특별히 포함하고 싶은 활동이나 장소가 있으신가요?`;

        await context.sendActivity(summary);
        userProfile.planningStage = "activities";
      } else {
        await context.sendActivity(
          "네, 말씀해주신 내용을 바탕으로 최적의 여행 계획을 제안해드리겠습니다."
        );
      }
    } else if (
      context.activity.type === "conversationUpdate" &&
      context.activity.membersAdded.length > 0
    ) {
      // 새 사용자가 추가되었을 때 웰컴 메시지 전송
      for (let idx in context.activity.membersAdded) {
        if (
          context.activity.membersAdded[idx].id !==
          context.activity.recipient.id
        ) {
          await this.sendInitialOptions(context);
        }
      }
    }
  }

  async sendInitialOptions(context) {
    const options = `안녕하세요! 저는 여행 플래너 봇입니다.

아래 두 옵션 중 하나를 선택해주세요:
1. 이미 생각한 여행 일정이 있어요.
2. 여행은 가고 싶지만 처음부터 도와주세요.`;

    await context.sendActivity(options);
  }
}

// 실시간 가이드 봇
class RealTimeGuideBot {
  constructor(conversationState, userState) {
    this.conversationState = conversationState;
    this.userState = userState;
  }

  async onTurn(context) {
    if (context.activity.type === "message") {
      await context.sendActivity(
        "현재 위치하신 곳의 날씨와 시간을 고려한 최적의 추천을 제공해드리겠습니다. 어떤 도움이 필요하신가요?"
      );
    } else if (
      context.activity.type === "conversationUpdate" &&
      context.activity.membersAdded.length > 0
    ) {
      // 새 사용자가 추가되었을 때 웰컴 메시지 전송
      for (let idx in context.activity.membersAdded) {
        if (
          context.activity.membersAdded[idx].id !==
          context.activity.recipient.id
        ) {
          await context.sendActivity(
            "안녕하세요! 저는 실시간 여행 가이드입니다. 어떤 도움이 필요하신가요?"
          );
        }
      }
    }
  }
}

// 봇 인스턴스 생성
const plannerBot = new TravelPlannerBot(conversationState, userState);
const guideBot = new RealTimeGuideBot(conversationState, userState);
const bot = new ChatBot();

// next 파라미터 추가
server.post("/api/messages", (req, res, next) => {
  console.log("Received message:", req.body);

  adapter.processActivity(req, res, async (context) => {
    try {
      if (context.activity.type === "message") {
        // 봇의 응답을 받아서 처리
        const botResponse = await bot.run(context);

        // 봇의 응답을 클라이언트에 전송
        res.json({
          type: "message",
          text: botResponse.text, // 봇이 보낸 실제 메시지
          timestamp: new Date().toISOString(),
          from: { id: "bot", name: "bot" },
          recipient: { id: "user", name: "user" },
        });
      }

      await conversationState.saveChanges(context);
      await userState.saveChanges(context);
    } catch (error) {
      console.error("Error processing activity:", error);
      res.status(500).json({
        type: "message",
        text: "죄송합니다. 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
        from: { id: "bot", name: "bot" },
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
});
