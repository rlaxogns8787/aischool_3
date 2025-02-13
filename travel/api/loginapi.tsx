import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Flask 백엔드 서버 기본 URL 설정
// Azure 웹 앱 서비스에 배포된 백엔드 주소
const BASE_URL = "https://5a031-gce0e3fhexdbh4c6.eastus-01.azurewebsites.net";

// 로그인 응답 타입 정의
interface LoginResponse {
  message: string; // 성공 메시지
  token: string; // 토큰 추가
  user_info: {
    username: string; // 사용자 이메일
    nickname: string; // 닉네임
    birthyear: number; // 출생연도
    gender: string; // 성별
    marketing_consent: boolean; // 마케팅 동의
  };
}

interface UpdateResponse {
  success: boolean;
  message: string;
  user_info?: {
    username: string;
    nickname: string;
    birthyear: number;
    gender: string;
    marketing_consent: boolean;
  };
}

/**
 * 회원가입 API 요청 함수
 * @param userData - 사용자 등록 정보 객체
 * @property {string} username - 사용자 이메일
 * @property {string} password - 사용자 비밀번호
 * @property {string} nickname - 사용자 닉네임
 * @property {number} birthyear - 사용자 출생연도
 * @property {string} gender - 사용자 성별
 * @property {number} marketing_consent - 마케팅 수신 동의 여부 (1: 동의, 0: 미동의)
 * @property {string[]} preferences - 선호 카테고리 배열
 * @returns {Promise} - 서버 응답 데이터
 * @throws {Error} - API 요청 실패 시 에러
 */
export const registerUser = async (userData: {
  username: string;
  password: string;
  nickname: string;
  birthyear: number;
  gender: string;
  marketing_consent: number;
  preferences?: string[]; // preferences를 선택적 파라미터로 변경
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: "Network error" };
  }
};

/**
 * 로그인 API 요청 함수
 * @param userData - 로그인 정보
 * @returns {Promise<LoginResponse>} - 로그인 응답 데이터
 */
export const loginUser = async (userData: {
  username: string; // email -> username
  password: string;
}): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${BASE_URL}/login`,
      userData
    );

    // 토큰과 사용자 정보 모두 저장
    if (response.data.token) {
      await AsyncStorage.setItem("userToken", response.data.token);
    }
    if (response.data.user_info) {
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(response.data.user_info)
      );
    }

    console.log("Login response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response ? error.response.data : { message: "Network error" };
  }
};

export const updateUserInfo = async (
  field: string,
  value: string | number,
  password?: { oldPassword: string; newPassword: string }
): Promise<UpdateResponse> => {
  try {
    // 토큰 가져오기
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
    }

    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);
    console.log("Updating user info:", { field, value, userInfo });

    const response = await axios.put<UpdateResponse>(
      `${BASE_URL}/user/update`,
      {
        username: userInfo.username, // 사용자 식별을 위해 username 추가
        field,
        value,
        ...(password && {
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
        }),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Update response:", response.data);

    // 서버 응답에 user_info가 있으면 즉시 저장
    if (response.data.user_info) {
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(response.data.user_info)
      );
      console.log("Updated user info in storage:", response.data.user_info);
    }

    return response.data;
  } catch (error) {
    console.error("Update error details:", error);
    if (error.response) {
      // 서버가 응답을 반환했지만 2xx 범위가 아닌 경우
      throw new Error(
        error.response.data.message || "정보 업데이트에 실패했습니다."
      );
      // 요청은 보냈지만 응답을 받지 못한 경우
    } else if (error.request) {
      // 요청 설정 중에 문제가 발생한 경우
      throw new Error("서버와 통신할 수 없습니다.");
    } else {
      throw new Error("요청 설정 중 오류가 발생했습니다.");
    }
  }
};
