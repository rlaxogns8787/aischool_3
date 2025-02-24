import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
} from "react-native";
import { X } from "lucide-react-native";

const EMOTIONS = [
  {
    id: "worst",
    label: "실망했어요",
    emoji: "😞",
    selectedStyle: {
      backgroundColor: undefined,
      background:
        "radial-gradient(50.6% 46.39% at 50.6% 53.61%, #F96C24 0%, #FFDF9B 100%)",
      shadowColor: "rgba(255, 232, 149, 0.6)",
      shadowOffset: { width: 0, height: 3.2 },
      shadowRadius: 29.12,
      shadowOpacity: 1,
      elevation: 5,
    },
  },
  {
    id: "bad",
    label: "아쉬웠어요",
    emoji: "🥲",
    selectedStyle: {
      backgroundColor: undefined,
      background:
        "radial-gradient(50.6% 46.39% at 50.6% 53.61%, #F96C24 0%, #FFDF9B 100%)",
      shadowColor: "rgba(255, 232, 149, 0.6)",
      shadowOffset: { width: 0, height: 3.2 },
      shadowRadius: 29.12,
      shadowOpacity: 1,
      elevation: 5,
    },
  },
  {
    id: "notBad",
    label: "보통이예요",
    emoji: "😐",
    selectedStyle: {
      backgroundColor: undefined,
      background: "linear-gradient(180deg, #C5FFFF 0%, #FFE895 100%)",
      shadowColor: "rgba(255, 232, 149, 0.6)",
      shadowOffset: { width: 0, height: 3.2 },
      shadowRadius: 29.12,
      shadowOpacity: 1,
      elevation: 5,
    },
  },
  {
    id: "good",
    label: "좋았어요",
    emoji: "🙂",
    selectedStyle: {
      backgroundColor: undefined,
      background:
        "radial-gradient(50% 50% at 50% 50%, #FF8C8C 0%, #FFEFB8 100%)",
      shadowColor: "rgba(255, 232, 149, 0.6)",
      shadowOffset: { width: 0, height: 3.2 },
      shadowRadius: 29.12,
      shadowOpacity: 1,
      elevation: 5,
    },
  },
  {
    id: "happy",
    label: "완벽했어요",
    emoji: "🥰",
    selectedStyle: {
      backgroundColor: undefined,
      background:
        "radial-gradient(59.37% 59.37% at 50% 50%, #FF8B0C 0%, #FFDFEA 100%)",
      shadowColor: "rgba(255, 232, 149, 0.6)",
      shadowOffset: { width: 0, height: 3.2 },
      shadowRadius: 29.12,
      shadowOpacity: 1,
      elevation: 5,
    },
  },
];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    emotion: string;
    feedback: string;
  }) => void;
  onSkip: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
  onSkip,
}) => {
  const [rating, setRating] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (!selectedEmotion) {
      alert("감정을 선택해주세요.");
      return;
    }
    if (!feedbackText.trim()) {
      alert("피드백 내용을 입력해주세요.");
      return;
    }

    onSubmit({
      rating,
      emotion: selectedEmotion,
      feedback: feedbackText.trim(),
    });

    // Reset form
    setRating(0);
    setSelectedEmotion("");
    setFeedbackText("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>오늘 일정은 어떠셨나요?</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                별점은 일정과 함께 일정기록에 함께 기록됩니다.
              </Text>
            </View>

            <View style={styles.ratingSection}>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Text
                      style={[
                        styles.starText,
                        { color: star <= rating ? "#FFD029" : "#EFF0F7" },
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* <Text style={styles.ratingGuideText}>
                별점은 일정 스토리와 함께 일정기록에 함께 기록됩니다.
              </Text> */}
            </View>

            <View style={styles.emotionSection}>
              <Text style={styles.emotionGuideText}>
                도슨트 개선을 위해 {"\n"} 감정과 피드백을 주시면 감사하겠습니다.
              </Text>
              <Text style={styles.sectionTitle}>여행 내내 기분은?</Text>
              <View style={styles.emotionContainer}>
                {EMOTIONS.map((emotion) => (
                  <View key={emotion.id} style={styles.emotionWrapper}>
                    <TouchableOpacity
                      onPress={() => setSelectedEmotion(emotion.id)}
                      style={[
                        styles.emotionButton,
                        selectedEmotion === emotion.id && {
                          ...styles.emotionButtonSelected,
                          ...(Platform.OS === "ios"
                            ? emotion.selectedStyle
                            : {
                                backgroundColor: "#FFE895",
                                elevation: 5,
                              }),
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.emojiContainer,
                          selectedEmotion === emotion.id &&
                            styles.emojiContainerSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.emojiText,
                            selectedEmotion === emotion.id
                              ? styles.emojiTextSelected
                              : styles.emojiTextDefault,
                          ]}
                        >
                          {emotion.emoji}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.emotionLabel}>{emotion.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.feedbackSection}>
              <TextInput
                style={styles.input}
                placeholder="피드백을 입력해주세요"
                placeholderTextColor="#767676"
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
              />
            </View>

            <View style={styles.buttonSection}>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>넘어가기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>제출하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    // padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    // marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#363636",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    // marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    // marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 34,
  },
  emotionSection: {
    marginBottom: 32,
  },
  emotionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  emotionWrapper: {
    alignItems: "center",
  },
  emotionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
  },
  emotionButtonSelected: {
    width: 64,
    height: 64,
  },
  emojiContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiContainerSelected: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(217, 217, 217, 0.4)",
    borderRadius: 200,
  },
  emojiText: {
    fontSize: 24,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  emojiTextDefault: {
    opacity: 0.7,
  },
  emojiTextSelected: {
    fontSize: 32,
    opacity: 1,
  },
  emotionLabel: {
    fontSize: 12,
    lineHeight: 14,
    color: "#686868",
    fontWeight: "500",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Inter" : "normal",
  },
  feedbackSection: {
    marginBottom: 32,
  },
  input: {
    height: 171,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: "#000000",
    textAlignVertical: "top",
  },
  buttonSection: {
    flexDirection: "row",
    gap: 8,
  },
  skipButton: {
    flex: 0.5,
    height: 48,
    backgroundColor: "#EDEDED",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    color: "#767676",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#006FFD",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  // ratingGuideText: {
  //   fontSize: 14,
  //   color: "#767676",
  //   textAlign: "center",
  // },
  emotionGuideText: {
    fontSize: 16,
    color: "#363636",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
});
