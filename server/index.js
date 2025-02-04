const express = require("express");
const multer = require("multer");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

// CORS 설정
app.use(cors());

// Azure 인증 정보를 환경변수에서 가져오기
const SPEECH_KEY = process.env.AZURE_KEY;
const SPEECH_REGION = process.env.AZURE_REGION;

app.post("/api/speech-to-text", upload.single("audio"), async (req, res) => {
  try {
    console.log("Received audio file:", req.file);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      SPEECH_KEY,
      SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = "ko-KR";

    const audioConfig = sdk.AudioConfig.fromWavFileInput(req.file.path);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    console.log("Starting speech recognition...");
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          console.log("Recognition result:", result);
          resolve(result);
        },
        (error) => {
          console.error("Recognition error:", error);
          reject(error);
        }
      );
    });

    fs.unlinkSync(req.file.path);

    if (result.text) {
      res.json({ text: result.text });
    } else {
      res.status(400).json({ error: "No speech could be recognized" });
    }
  } catch (error) {
    console.error("Speech recognition error:", error);
    res.status(500).json({ error: "Speech recognition failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
