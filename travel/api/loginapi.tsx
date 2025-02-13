import axios from "axios";

// Flask 백엔드 서버 기본 URL 설정
// Azure 웹 앱 서비스에 배포된 백엔드 주소
const BASE_URL = "https://5a031-gce0e3fhexdbh4c6.eastus-01.azurewebsites.net";

// 로그인 응답 타입 정의
interface LoginResponse {
  message: string; // 성공 메시지
  user_info: {
    username: string; // 사용자 이메일
    nickname: string; // 닉네임
    birthyear: number; // 출생연도
    gender: string; // 성별
    marketing_consent: boolean; // 마케팅 동의
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
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: "Network error" };
  }
};
