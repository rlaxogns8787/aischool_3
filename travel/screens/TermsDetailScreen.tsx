import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TERMS_CONTENT } from "./AgreementScreen";

type RootStackParamList = {
  Agreement: undefined;
  TermsDetail: {
    title?: string;
    type?: "service" | "privacy" | "location" | "marketing";
  };
};

type TermsDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TermsDetail"
>;

export default function TermsDetailScreen({ navigation, route }: TermsDetailScreenProps) {
  const { title = "이용약관", type } = route.params || {};
  const content = TERMS_CONTENT[type] || "내용을 불러올 수 없습니다."; 

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: title,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, title]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 제목 (가운데 정렬) */}
        <Text style={styles.title}>{title}</Text>

        {/* 본문을 줄 단위로 나누고 조항 그룹과 조항 제목 강조 적용 */}
        {content.split("\n").map((line, index) => {
          // "X. (조항 그룹 제목)" 형식의 큰 제목을 강조
          if (/^\d+\.\s/.test(line)) {
            return (
              <Text key={index} style={styles.sectionGroupTitle}>
                {line}
              </Text>
            );
          }

          // "제X조" 형식의 조항 제목을 강조
          if (line.startsWith("제") && line.includes("조")) {
            return (
              <Text key={index} style={styles.sectionTitle}>
                {line}
              </Text>
            );
          }

          // "①", "②" 등의 숫자로 시작하는 목록 항목 (들여쓰기 정렬)
          if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(line)) {
            return (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listNumber}>{line.charAt(0)}</Text>
                <Text style={styles.listContent}>{line.slice(1).trim()}</Text>
              </View>
            );
          }

          // 일반 본문 내용 표시
          return (
            <Text key={index} style={styles.content}>
              {line}
            </Text>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionGroupTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 18,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 5,
  },
  listNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    width: 24, 
    lineHeight: 26,
    textAlign: "right",
    marginRight: 8,
  },
  listContent: {
    flex: 1, 
    fontSize: 16,
    lineHeight: 26,
    color: "#444",
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: "#444",
    marginBottom: 8,
  },
});
