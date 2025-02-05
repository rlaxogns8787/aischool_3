import { Platform } from "react-native";

// 임시로 하드코딩된 값을 반환
export const getEnv = (name: string): string => {
  const envVars = {
    AZURE_SPEECH_KEY:
      "9ot6vDP41TrM6i1MRWbtsyZrOFlXDy4UunpzMcZbT5QrzyLvEHDYJQQJ99BAACYeBjFXJ3w3AAAYACOGvVzj",
    AZURE_SPEECH_REGION: "eastus",
  };
  return envVars[name] || "";
};
