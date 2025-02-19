import { TMAP_API_KEY } from "../constants/tmap"; // 🔹 API_KEY를 별도 파일에서 관리

// TMap 장소 검색 API 호출 함수
export async function getLatLngFromTmap(placeName: string) {
  const url = `https://apis.openapi.sk.com/tmap/pois?version=1&format=json&searchKeyword=${encodeURIComponent(
    placeName
  )}&searchType=all&appKey=${TMAP_API_KEY}`;

  try {
    console.log(`📡 TMap API 요청: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log("🔵 TMap API 응답 확인:", JSON.stringify(data, null, 2)); // 📌 API 응답 확인

    if (data?.searchPoiInfo?.pois?.poi?.length > 0) {
      const poi = data.searchPoiInfo.pois.poi[0]; // 첫 번째 검색 결과를 사용

      const lat = poi.frontLat ? parseFloat(poi.frontLat) : 0;
      const lng = poi.frontLon ? parseFloat(poi.frontLon) : 0;

      console.log(`✅ ${placeName} 좌표:`, lat, lng);

      return {
        lat,
        lng,
      };
    } else {
      console.warn("TMap에서 좌표를 찾을 수 없음:", placeName);
      return { lat: 0, lng: 0 };
    }
  } catch (error) {
    console.error("TMap 좌표 조회 오류:", error);
    return { lat: 0, lng: 0 };
  }
}
