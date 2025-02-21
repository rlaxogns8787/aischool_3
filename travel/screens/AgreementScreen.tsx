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
import { Check } from "lucide-react-native";

type AgreementScreenProps = {
  navigation: any;
};

export const TERMS_CONTENT = {
  service: `
1. 총칙
제1조 (목적)
본 약관은 AI 기반 여행 추천 서비스를 제공하는 회사(이하 "회사")가 운영하는 서비스 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
① 서비스: AI 알고리즘을 활용한 여행 일정 추천, 관광지 정보 제공, 사용자 맞춤형 여행 가이드 등을 포함한 모든 기능을 의미합니다.
② 회원: 본 서비스를 이용하는 개인을 의미하며, 회원 가입 후 서비스를 이용할 수 있습니다.
③ AI 추천 시스템: 사용자 데이터(이용 기록, 관심 지역, 관심사 등)를 기반으로 여행 일정을 자동 추천하는 알고리즘을 의미합니다.

2. 서비스 이용
제3조 (서비스의 제공 및 AI 추천 기준)
① 회사는 AI 알고리즘을 통해 사용자에게 맞춤형 여행 일정을 추천합니다.
② AI 추천 시스템은 문화 빅데이터 플랫폼 및 서울 열린 데이터 광장의 데이터를 활용하여 보다 정교한 여행 정보를 제공합니다.
③ 사용자는 필터링 옵션을 활용하여 선호하는 여행 스타일(문화, 음식, 역사, 자연 등)을 조정할 수 있습니다.
④ AI 추천이 특정 그룹을 차별하지 않도록 주기적인 점검과 개선이 이루어집니다.
제4조 (책임과 신뢰성 확보)
① 회사는 AI 여행 추천의 신뢰성을 유지하기 위해 정기적인 성능 점검 및 업데이트를 수행합니다.
② AI 추천 오류로 인해 발생한 정보 불일치는 사용자의 신고를 반영하여 개선되며, 업데이트 내역을 사용자에게 제공합니다.
제 5조 (접근성 지원)
① 고령 사용자 및 장애인을 위한 음성 가이드 기능 제공 및 텍스트 구성을 고려하여 포용성을 강화합니다.`,

  privacy: `
1. 개인정보의 수집 및 이용 목적
회사는 다음과 같은 목적으로 사용자의 개인정보를 수집 및 처리합니다.
① AI 개인화 추천 서비스 제공: 사용자의 관심 지역, 검색 기록을 분석하여 맞춤형 여행 일정을 추천합니다.
② 서비스 개선 및 연구: AI 알고리즘 개선을 위한 데이터 분석을 수행하며, 이 과정에서 개인정보는 익명화 처리됩니다.
③ 보안 및 사용자 보호: 사용자의 데이터 보호를 위해 모든 개인정보는 암호화되어 저장되며, 외부 유출을 방지합니다.

2. 개인정보의 처리 및 보유 기간
① 사용자의 동의하에 수집된 정보는 최대 3년간 보관 후 자동 삭제됩니다.
② 사용자가 탈퇴할 경우, 관련 데이터는 즉시 삭제되며, AI 학습용 데이터에서 사용자의 개인 정보는 제거됩니다.`,

  location: `
1. 위치정보 수집
회사는 사용자의 동의하에 위치 정보를 수집하며, 이를 기반으로 맞춤형 여행 서비스를 제공합니다.

2. 위치정보의 이용 및 보호
① 위치 기반 추천 기능은 사용자의 현재 위치를 기반으로 관광지, 맛집, 숙소 등을 제공하는 데 활용됩니다.
② 사용자의 실시간 위치 데이터는 외부와 공유되지 않습니다.`,

  marketing: `
1. 마케팅 정보 수신 동의 및 활용 목적
① 사용자는 이메일, SMS, 앱 푸시 알림을 통해 AI 추천 여행 정보, 프로모션, 이벤트 소식을 받아볼 수 있습니다.
② AI가 사용자 취향을 분석하여 맞춤형 혜택을 추천하되, 사용자가 직접 추천 기준을 설정할 수 있습니다.

2. 수신 거부
① 사용자는 언제든지 마케팅 정보 수신을 거부할 수 있으며, 거부 시 추가적인 알림이 전송되지 않습니다.
② AI 추천을 비활성화하는 경우, 기본적인 여행 정보 제공은 유지됩니다.`,
};

export default function AgreementScreen({ navigation }: AgreementScreenProps) {
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

  // const handleTermsClick = (
  //   type: "service" | "privacy" | "location" | "marketing",
  //   title: string
  // ) => {
  //   navigation.navigate("TermsDetail", {
  //     title,
  //     content: TERMS_CONTENT[type] || "이벤트 및 혜택 관련 안내 내용입니다.",
  //   });
  // };

  const handleTermsClick = (type: "service" | "privacy" | "location" | "marketing", title: string) => {
    navigation.navigate("TermsDetail", { title, type });
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
