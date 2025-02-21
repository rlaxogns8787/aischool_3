import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  CustomerSupport: undefined;
};

type CustomerSupportScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CustomerSupport"
>;

export default function CustomerSupportScreen({
  navigation,
}: CustomerSupportScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>문의하기</Text>
      </View>

      {/* 고객센터 정보 */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>고객센터 운영 안내</Text>
        <Text style={styles.infoText}>• 평일 10:00 - 18:00 (점심시간 12:30 - 13:30)</Text>
        <Text style={[styles.infoText, styles.redText]}>• 토, 일/공휴일 휴무</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>문의 방법</Text>
        <Text style={styles.infoText}>📞 전화 문의: 02-1234-5678</Text>
        <Text style={styles.infoText}>✉ 이메일 문의: support@ssappy.com</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>회사 정보</Text>
        <Text style={styles.infoText}>• 상호명: (주) SSAPY</Text>
        <Text style={styles.infoText}>• 사업자 등록번호: 000-00-00000</Text>
      </View>

      {/* 1:1 문의 버튼 */}
      <TouchableOpacity style={styles.chatButton}>
        <Text style={styles.chatButtonText}>🚨 서비스 오류 신고 🚨</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "400",
  },
  content: {
    padding: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  redText: {
    color: "#FF3B30",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },
  chatButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    alignItems: "center",
    margin: 20,
    borderRadius: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
