import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronLeft } from "lucide-react-native";

type AgreementScreenProps = {
  navigation: any;
  route: any;
};

export const TERMS_CONTENT = {
  service: `서비스 이용약관

1. 총칙
제1조 (목적)
본 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다...

2. 서비스 이용
제3조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다...`,

  privacy: `개인정보 처리방침

1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다...

2. 개인정보의 처리 및 보유 기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다...`,

  location: `위치서비스 이용약관

1. 위치정보 수집
회사는 위치기반서비스를 제공하기 위해 이용자의 위치정보를 수집합니다...

2. 위치정보의 이용
수집된 위치정보는 다음과 같이 이용됩니다...`,

  marketing: `이벤트 및 혜택 안내

1. 마케팅 정보 수신 동의
회원은 회사가 제공하는 이벤트 및 혜택 정보를 이메일, SMS, 앱 푸시 알림 등을 통해 받아보실 수 있습니다.

2. 수신 거부
회원은 언제든지 마케팅 정보 수신을 거부할 수 있으며, 이 경우 회사는 해당 회원에게 마케팅 정보를 발송하지 않습니다...`,
};

export default function AgreementScreen({
  navigation,
  route,
}: AgreementScreenProps) {
  const showHeader = route.params?.showHeader;

  const [agreements, setAgreements] = useState({
    all: false,
    age: false,
    service: false,
    privacy: false,
    marketing: false,
    location: false,
  });

  const handleToggleAll = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      age: newValue,
      service: newValue,
      privacy: newValue,
      marketing: newValue,
      location: newValue,
    });
  };

  const handleToggle = (key: keyof typeof agreements) => {
    if (key === "all") {
      handleToggleAll();
      return;
    }

    setAgreements((prev) => {
      const newAgreements = {
        ...prev,
        [key]: !prev[key],
      };
      // Check if all required agreements are checked
      const allChecked = [
        "age",
        "service",
        "privacy",
        "marketing",
        "location",
      ].every((k) =>
        k === "marketing" ? true : newAgreements[k as keyof typeof agreements]
      );

      return {
        ...newAgreements,
        all: allChecked,
      };
    });
  };

  const handleNext = () => {
    if (!agreements.age || !agreements.service || !agreements.privacy) {
      Alert.alert("알림", "필수 약관에 모두 동의해주세요.");
      return;
    }

    // Navigate to sign up screen with agreement state
    navigation.replace("Auth", {
      isSignUp: true,
      agreements: {
        marketing: agreements.marketing,
      },
    });
  };

  const handleTermsClick = (
    type: "service" | "privacy" | "location" | "marketing",
    title: string
  ) => {
    navigation.navigate("TermsDetail", {
      title,
      content: TERMS_CONTENT[type] || "이벤트 및 혜택 관련 안내 내용입니다.",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: "#007AFF" }]}>
              <Text style={[styles.stepNumber, { color: "#fff" }]}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: "#007AFF" }]}>
              약관 동의
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: "#F5F5F5" }]}>
              <Text style={[styles.stepNumber, { color: "#8E8E93" }]}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: "#8E8E93" }]}>
              사용자 정보
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, { backgroundColor: "#F5F5F5" }]}>
              <Text style={[styles.stepNumber, { color: "#8E8E93" }]}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: "#8E8E93" }]}>
              취향 분석
            </Text>
          </View>
        </View>

        <Text style={styles.title}>회원가입</Text>

        <TouchableOpacity style={styles.agreementRow} onPress={handleToggleAll}>
          <View style={styles.checkboxContainer}>
            <View
              style={[styles.checkbox, agreements.all && styles.checkboxActive]}
            >
              {agreements.all && <Check size={16} color="#fff" />}
            </View>
            <Text style={styles.allAgreeText}>전체 동의합니다</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => handleToggle("age")}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[styles.checkbox, agreements.age && styles.checkboxActive]}
            >
              {agreements.age && <Check size={16} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>만 14세 이상입니다. (필수)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => handleToggle("service")}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                agreements.service && styles.checkboxActive,
              ]}
            >
              {agreements.service && <Check size={16} color="#fff" />}
            </View>
            <View style={styles.agreementTextContainer}>
              <TouchableOpacity
                onPress={() => handleTermsClick("service", "서비스 이용약관")}
              >
                <Text style={[styles.agreementText, styles.linkText]}>
                  서비스 이용약관
                </Text>
              </TouchableOpacity>
              <Text style={styles.requiredText}>(필수)</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => handleToggle("privacy")}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                agreements.privacy && styles.checkboxActive,
              ]}
            >
              {agreements.privacy && <Check size={16} color="#fff" />}
            </View>
            <View style={styles.agreementTextContainer}>
              <TouchableOpacity
                onPress={() => handleTermsClick("privacy", "개인정보 처리방침")}
              >
                <Text style={[styles.agreementText, styles.linkText]}>
                  개인정보 수집 및 이용 동의
                </Text>
              </TouchableOpacity>
              <Text style={styles.requiredText}>(필수)</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => handleToggle("location")}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                agreements.location && styles.checkboxActive,
              ]}
            >
              {agreements.location && <Check size={16} color="#fff" />}
            </View>
            <View style={styles.agreementTextContainer}>
              <TouchableOpacity
                onPress={() =>
                  handleTermsClick("location", "위치서비스 이용약관")
                }
              >
                <Text style={[styles.agreementText, styles.linkText]}>
                  위치서비스 이용 동의
                </Text>
              </TouchableOpacity>
              <Text style={styles.requiredText}>(선택)</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => handleToggle("marketing")}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                agreements.marketing && styles.checkboxActive,
              ]}
            >
              {agreements.marketing && <Check size={16} color="#fff" />}
            </View>
            <View style={styles.agreementTextContainer}>
              <TouchableOpacity
                onPress={() =>
                  handleTermsClick("marketing", "이벤트 및 혜택 안내")
                }
              >
                <Text style={[styles.agreementText, styles.linkText]}>
                  이벤트 및 혜택 안내
                </Text>
              </TouchableOpacity>
              <Text style={styles.requiredText}>(선택)</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.nextButton,
          (!agreements.age || !agreements.service || !agreements.privacy) &&
            styles.nextButtonDisabled,
        ]}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>동의하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.laterButton}
        onPress={() => navigation.replace("Auth")}
      >
        <Text style={styles.laterButtonText}>다음에 가입할래요</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => navigation.replace("Main")}
      >
        <Text style={styles.adminButtonText}>관리자 로그인</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 40,
    marginLeft: 20,
  },
  agreementRow: {
    paddingVertical: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  allAgreeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  agreementText: {
    fontSize: 16,
    color: "#000",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressLine: {
    height: 1,
    flex: 0.5,
    backgroundColor: "#E5E5EA",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  agreementTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkText: {
    textDecorationLine: "underline",
    textDecorationColor: "#000000",
    color: "#000000",
  },
  requiredText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 4,
  },
  laterButton: {
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  laterButtonText: {
    color: "#8E8E93",
    fontSize: 16,
  },
  adminButton: {
    padding: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  adminButtonText: {
    color: "#C7C7CC",
    fontSize: 14,
  },
});
