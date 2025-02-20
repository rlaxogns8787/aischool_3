import axios from "axios";

const OPENWEATHERMAP_KEY = "d8b6ec4b0d962bb74c5f798fd68d197b";
const KAKAO_API_KEY = "a98b3d67979288daf0c29c88075998ab";
const REVERSE_GEOCODING_URL = "http://api.openweathermap.org/geo/1.0/reverse";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const KAKAO_GEO_URL = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";

export interface WeatherData {
  temperature: number;
  condition: string;
  high: number;
  low: number;
  hourly: Array<{
    time: string;
    temp: number;
    condition: string;
  }>;
  location: string;
}

interface ForecastEntry {
  main: {
    temp: number;
  };
  weather: Array<{ main: string; description: string }>; // 🌟 weather 속성 추가
  dt_txt: string;
}

// Kakao API를 사용하여 구 단위 주소 가져오기
async function getDistrictName(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await axios.get(KAKAO_GEO_URL, {
      params: { x: longitude, y: latitude },
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    });

    const regionData = response.data.documents[0];
    const locationName = `${regionData.region_1depth_name} ${regionData.region_2depth_name}`;
    return locationName;
  } catch (error) {
    console.error("Kakao API Error:", error);
    return "위치 정보 없음";
  }
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    const weatherUrl = `${BASE_URL}?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_KEY}&units=metric&lang=kr`;
    const response = await axios.get(weatherUrl);
    const weatherData = response.data;

    const locationName = await getDistrictName(latitude, longitude);

    const forecastUrl = `${FORECAST_URL}?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_KEY}&units=metric&lang=kr`;
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;

    const today = new Date().toISOString().split("T")[0];

    let highTemp = -Infinity;
    let lowTemp = Infinity;

    const forecastList: ForecastEntry[] = forecastData.list;
    forecastList.forEach((entry) => {
      if (entry.dt_txt.startsWith(today)) {
        const temp = entry.main.temp;
        highTemp = Math.max(highTemp, temp);
        lowTemp = Math.min(lowTemp, temp);
      }
    });

    // 반올림된 현재 기온
    const roundedTemp = Math.round(weatherData.main.temp);
    // 반올림된 최저/최고 기온
    const roundedHigh = Math.round(weatherData.main.temp_max);
    const roundedLow = Math.round(weatherData.main.temp_min);
    // 반올림된 예보 기반 최저/최고 기온
    const forecastHigh = Math.round(highTemp);
    const forecastLow = Math.round(lowTemp);

    return {
      temperature: roundedTemp,

      condition: weatherData.weather[0].description || "맑음",

      // 반올림된 값이 같으면 예보 API 사용, 다르면 OpenWeather 값 사용
      high: roundedHigh === roundedTemp ? forecastHigh : roundedHigh,

      low: roundedLow === roundedTemp ? forecastLow : roundedLow,

      location: locationName,

      hourly: forecastList.slice(0, 6).map((entry, index) => ({
        time: `${9 + index}AM`,
        temp: Math.round(entry.main.temp),
        condition: entry.weather[0].main,
      })),
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    // 에러 발생 시 기본 날씨 데이터 반환
    return {
      temperature: 24,
      condition: "맑음",
      high: 27,
      low: 19,
      location: "서울 잠실동",
      hourly: [
        { time: "9AM", temp: 22, condition: "sunny" },
        { time: "10AM", temp: 23, condition: "sunny" },
        { time: "11AM", temp: 24, condition: "sunny" },
        { time: "12PM", temp: 25, condition: "sunny" },
        { time: "1PM", temp: 26, condition: "sunny" },
        { time: "2PM", temp: 27, condition: "sunny" },
      ],
    };
  }
}