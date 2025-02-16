const AZURE_MAPS_KEY =
  "7iEv0kILZZ3Fzwx3hi3KblwFmx4QcPX8YsVBEXdaQTu8BtMbAPzGJQQJ99BBACYeBjFUZlQXAAAgAZMPd2ld";
const AZURE_MAPS_CLIENT_ID = "b6a940db-c318-477c-baea-f8f8180062b0";
const AZURE_MAPS_ENDPOINT = "https://atlas.microsoft.com/weather/current/json";

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

export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    const url = `${AZURE_MAPS_ENDPOINT}?api-version=1.0&query=${latitude},${longitude}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": AZURE_MAPS_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Weather API failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Weather API response:", data);

    if (!data.results?.[0]) {
      throw new Error("No weather data available");
    }

    const result = data.results[0];
    const temp = Math.round(result.temperature?.value || 0);

    return {
      temperature: temp,
      condition: result.phrase || "맑음",
      high: Math.round(
        result.temperatureSummary?.past24Hours?.maximum?.value || temp + 3
      ),
      low: Math.round(
        result.temperatureSummary?.past24Hours?.minimum?.value || temp - 3
      ),
      location: "현재 위치",
      hourly: [
        { time: "9AM", temp: temp - 2, condition: "sunny" },
        { time: "10AM", temp: temp - 1, condition: "sunny" },
        { time: "11AM", temp: temp, condition: "sunny" },
        { time: "12PM", temp: temp + 1, condition: "sunny" },
        { time: "1PM", temp: temp + 2, condition: "sunny" },
        { time: "2PM", temp: temp + 1, condition: "sunny" },
      ],
    };
  } catch (error) {
    console.error("Error details:", error);
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
