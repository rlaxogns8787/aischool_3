import { useState, useCallback } from "react";
import { AzureService } from "../services/azureService";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export function useAzureBot() {
  const [isProcessing, setIsProcessing] = useState(false);
  const azureService = new AzureService();

  const processQuery = useCallback(
    async (
      query: string,
      conversationHistory: ChatMessage[] = []
    ): Promise<{
      text: string;
      additionalData?: any;
    }> => {
      setIsProcessing(true);
      try {
        // 1. 관련 여행 정보 검색
        const searchResults = await azureService.searchTourInfo(query);
        const context = searchResults.map((r) => r.content).join("\n");

        // 2. ChatGPT로 응답 생성
        const messages = [
          {
            role: "system",
            content: `당신은 여행 가이드 AI입니다. 다음 정보를 바탕으로 답변해주세요:\n${context}`,
          },
          ...conversationHistory,
          { role: "user", content: query },
        ];

        const answer = await azureService.getChatCompletion(messages, context);

        // 3. 추가 데이터 추출 (예: 지도 좌표)
        const additionalData = searchResults[0]?.metadata;

        return {
          text: answer,
          additionalData,
        };
      } catch (error) {
        console.error("Query processing error:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    processQuery,
    isProcessing,
  };
}
