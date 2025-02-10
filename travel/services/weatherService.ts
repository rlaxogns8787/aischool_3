const AZURE_MAPS_KEY =
  "7iEv0kILZZ3Fzwx3hi3KblwFmx4QcPX8YsVBEXdaQTu8BtMbAPzGJQQJ99BBACYeBjFUZlQXAAAgAZMPd2ld";
const AZURE_MAPS_CLIENT_ID = "b6a940db-c318-477c-baea-f8f8180062b0";
const AZURE_MAPS_ENDPOINT =
  "https://atlas.microsoft.com/weather/currentConditions/json";

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
}

export async function getCurrentWeather(
  location: string
): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${AZURE_MAPS_ENDPOINT}?api-version=1.0&query=${encodeURIComponent(
        location
      )}`,
      {
        headers: {
          "x-ms-client-id": AZURE_MAPS_CLIENT_ID,
          "Ocp-Apim-Subscription-Key": AZURE_MAPS_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error("API Response:", await response.text());
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    if (!data.results || !data.results[0]) {
      throw new Error("Invalid weather data format");
    }

    const result = data.results[0];

    return {
      temperature: Math.round(result.temperature?.value || 21),
      condition: result.phrase || "맑음",
      high: Math.round(result.temperature?.maximum || 24),
      low: Math.round(result.temperature?.minimum || 13),
      hourly: [
        { time: "9AM", temp: 22, condition: "sunny" },
        { time: "10AM", temp: 23, condition: "sunny" },
        { time: "11AM", temp: 18, condition: "sunny" },
        { time: "12PM", temp: 19, condition: "cloudy" },
        { time: "1PM", temp: 21, condition: "cloudy" },
        { time: "2PM", temp: 22, condition: "cloudy" },
      ],
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    // 에러 발생 시 기본 날씨 데이터 반환
    return {
      temperature: 21,
      condition: "맑음",
      high: 24,
      low: 13,
      hourly: [
        { time: "9AM", temp: 22, condition: "sunny" },
        { time: "10AM", temp: 23, condition: "sunny" },
        { time: "11AM", temp: 18, condition: "sunny" },
        { time: "12PM", temp: 19, condition: "cloudy" },
        { time: "1PM", temp: 21, condition: "cloudy" },
        { time: "2PM", temp: 22, condition: "cloudy" },
      ],
    };
  }
}
