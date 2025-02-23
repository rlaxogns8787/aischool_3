import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Flask 백엔드 서버 기본 URL
const BASE_URL = "https://5a031-gce0e3fhexdbh4c6.eastus-01.azurewebsites.net";

interface RegisterUserData {
  username: string;
  password: string;
  nickname: string;
  birthyear: number;
  gender: string;
  marketing_consent: number;
  preferences?: string[]; // Optional
  music_genres?: string[]; // Optional
}

/**
 * 회원가입 API 요청
 */
export const registerUser = async (userData: RegisterUserData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, userData);
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : { message: "Network error" };
  }
};

/**
 * 로그인 API 요청
 */
export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, userData);

    if (response.data.user_info) {
      console.log("📥 [LoginAPI] 서버에서 받은 사용자 정보:", {
        username: response.data.user_info.username,
        preferences: response.data.user_info.preferences || [],
        music_genres: response.data.user_info.music_genres || [],
      });

      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(response.data.user_info)
      );
      // 사용자 이름을 별도로 저장
      await AsyncStorage.setItem("username", response.data.user_info.username);
    }

    console.log("✅ [LoginAPI] 로그인 완료, 응답 데이터:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response ? error.response.data : { message: "Network error" };
  }
};

/**
 * 사용자 정보 업데이트 API 요청
 */
export const updateUserInfo = async (field, value, password?) => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);
    const username = userInfo.username;

    if (!username) {
      throw new Error("username이 없습니다.");
    }

    // 서버에 보낼 데이터 구성
    let updateData = {
      username, // username 추가
      field,
      value,
    };

    // 비밀번호 변경의 경우
    if (password) {
      updateData = {
        ...updateData,
        oldPassword: password.oldPassword,
        newPassword: password.newPassword,
      };
    }

    const response = await axios.put(
      `${BASE_URL}/user/${username}`,
      updateData
    );

    console.log("Update response:", response.data);

    if (response.data.message === "User information updated successfully") {
      // 로컬 userData 업데이트
      const currentUserData = JSON.parse(userData);
      let updatedUserData = { ...currentUserData };

      // preferences나 music_genres 업데이트인 경우
      if (field === "preferences" || field === "music_genres") {
        updatedUserData[field] = value; // 새로운 값으로 업데이트
      } else {
        updatedUserData[field] = value;
      }

      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      return { success: true, message: response.data.message };
    }

    return response.data;
  } catch (error: any) {
    console.error("Update error details:", error);
    throw new Error(
      error.response?.data?.message || "정보 업데이트에 실패했습니다."
    );
  }
};

/**
 * 여행 일정 추가 API
 */
export const addSchedule = async (scheduleData) => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }
    const userInfo = JSON.parse(userData);
    console.log("User Info:", userInfo); // 사용자 정보 확인
    const formattedScheduleData = {
      username: userInfo.username,
      tripId: scheduleData.tripId,
      timestamp: new Date().toISOString(),
      title: scheduleData.title,
      companion: scheduleData.companion,
      startDate: scheduleData.startDate,
      endDate: scheduleData.endDate,
      duration: scheduleData.duration,
      budget: scheduleData.budget,
      transportation: scheduleData.transportation,
      keywords: scheduleData.keywords,
      summary: scheduleData.summary,
      days: scheduleData.days,
      extraInfo: scheduleData.extraInfo,
      generatedScheduleRaw: JSON.stringify(scheduleData),
    };
    console.log("Formatted Schedule Data:", formattedScheduleData); // 포맷된 일정 데이터 확인
    const response = await axios.post(
      `${BASE_URL}/schedule`,
      formattedScheduleData
    );
    console.log("Add Schedule Response:", response.data); // 서버 응답 확인
    return response.data;
  } catch (error) {
    console.error("Add schedule error:", error);
    throw new Error(
      error.response?.data?.message || "일정 추가에 실패했습니다."
    );
  }
};

/**
 * 여행 일정 삭제 API
 */
export const deleteSchedule = async (scheduleId) => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);

    const response = await axios.delete(`${BASE_URL}/schedule/${scheduleId}`, {
      params: { username: userInfo.username },
    });

    return response.data;
  } catch (error) {
    console.error("Delete schedule error:", error);
    throw new Error(
      error.response?.data?.message || "일정 삭제에 실패했습니다."
    );
  }
};

/**
 * 여행 일정 조회 API
 */
export const getSchedules = async () => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);

    const response = await axios.get(`${BASE_URL}/schedule`, {
      params: { username: userInfo.username },
    });

    return response.data;
  } catch (error) {
    console.error("Get schedules error:", error);
    throw new Error(
      error.response?.data?.message || "일정 조회에 실패했습니다."
    );
  }
};

/**
 * 여행 기록 추가 API_2
 */
export const addrecord = async (scheduleData) => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }
    const userInfo = JSON.parse(userData);
    console.log("User Info:", userInfo); // 사용자 정보 확인
    const formattedScheduleData = {
      username: userInfo.username,
      tripId: scheduleData.tripId,
      timestamp: new Date().toISOString(),
      title: scheduleData.title,
      companion: scheduleData.companion,
      startDate: scheduleData.startDate,
      endDate: scheduleData.endDate,
      duration: scheduleData.duration,
      budget: scheduleData.budget,
      transportation: scheduleData.transportation,
      keywords: scheduleData.keywords,
      summary: scheduleData.summary,
      days: scheduleData.days,
      extraInfo: scheduleData.extraInfo,
      generatedScheduleRaw: JSON.stringify(scheduleData),
    };
    console.log("Formatted Schedule Data:", formattedScheduleData); // 포맷된 일정 데이터 확인
    const response = await axios.post(
      `${BASE_URL}/additional_schedule`,
      formattedScheduleData
    );
    console.log("Add record Response:", response.data); // 서버 응답 확인
    return response.data;
  } catch (error) {
    console.error("Add record error:", error);
    throw new Error(
      error.response?.data?.message || "일정 추가에 실패했습니다."
    );
  }
};

/**
 * 여행 기록 삭제 API
 */
export const deleterecord = async (scheduleId) => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);

    const response = await axios.delete(
      `${BASE_URL}/additional_schedule/${scheduleId}`,
      {
        params: { username: userInfo.username },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Delete schedule error:", error);
    throw new Error(
      error.response?.data?.message || "일정 삭제에 실패했습니다."
    );
  }
};

/**
 * 여행 기록 조회 API
 */
export const getrecord = async () => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);

    const response = await axios.get(`${BASE_URL}/additional_schedule`, {
      params: { username: userInfo.username },
    });

    return response.data;
  } catch (error) {
    console.error("Get schedules error:", error);
    throw new Error(
      error.response?.data?.message || "일정 조회에 실패했습니다."
    );
  }
};

// 특정 ID만 가져오기
export const fetchScheduleById = async (id: string) => {
  try {
    console.log("📌 요청한 scheduleId:", id);

    const schedules = await getSchedules();

    if (!Array.isArray(schedules)) {
      console.error("🚨 getSchedules()가 배열을 반환하지 않음:", schedules);
      return null;
    }

    const matchedSchedule = schedules.find((sched: any) => sched.tripId === id);

    if (!matchedSchedule) {
      console.warn("해당 scheduleId를 가진 일정이 없습니다:", id);
      return null;
    }
    // console.log("✅ 찾은 일정 데이터:", matchedSchedule);

    return matchedSchedule;
  } catch (error) {
    console.error("일정 가져오기 실패:", error);
    return null;
  }
};

/**
 * 닉네임 중복 확인 API(임시 주석처리)
 */
// export const checkNicknameDuplicate = async (nickname: string) => {
//   try {
//     // 실제 서버의 닉네임 중복 확인 엔드포인트로 수정
//     const response = await axios.post(`${BASE_URL}/check-duplicate`, {
//       type: "nickname",
//       value: nickname,
//     });
//     return response.data;
//   } catch (error: any) {
//     // 서버 응답 에러 처리 개선
//     if (error.response) {
//       // 서버가 응답한 경우
//       throw error.response.data;
//     } else if (error.request) {
//       // 요청은 보냈지만 응답을 받지 못한 경우
//       throw { message: "서버에서 응답이 없습니다. 잠시 후 다시 시도해주세요." };
//     } else {
//       // 요청 자체를 보내지 못한 경우
//       throw { message: "네트워크 연결을 확인해주세요." };
//     }
//   }
// };

/**
 * 피드백 저장 API
 */
interface FeedbackData {
  rating: number;
  emotion: string;
  feedback: string;
  location: string;
  timestamp: string;
  username?: string;
}

interface FeedbackResponse {
  message: string;
  feedback_id: number;
  analysis: string;
  improved_script: string;
}

export const saveFeedback = async (
  feedbackData: FeedbackData
): Promise<FeedbackResponse> => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const userInfo = JSON.parse(userData);
    const formattedFeedbackData = {
      ...feedbackData,
      username: userInfo.username,
    };

    const response = await axios.post<FeedbackResponse>(
      `${BASE_URL}/api/feedback`,
      formattedFeedbackData
    );

    return response.data;
  } catch (error: any) {
    console.error("Save feedback error:", error);
    throw new Error(
      error.response?.data?.message || "피드백 저장에 실패했습니다."
    );
  }
};
