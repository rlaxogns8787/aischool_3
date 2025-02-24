import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
// import { getSchedules } from "../api/loginapi";
import { fetchScheduleById } from "../api/loginapi";
import * as Location from "expo-location"; // Expo Location 임포트

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";

// TMap v2 전역 선언 (TS)
declare global {
  interface Window {
    Tmapv2: any;
    updateRoute: (routePath: { lat: number; lng: number }[]) => void;
  }
}

// 위치 데이터 구조
interface LocationData {
  lat: number;
  lng: number;
  title?: string;
}

// 경로 타입 설정
type RouteType = "car" | "taxi" | "transit" | "pedestrian";

// **추가**: TMapRouteProps에 scheduleId 전달
type TMapRouteProps = {
  scheduleId: string; // eg. schedule.id or schedule.tripId
};

const TMapRoute: React.FC<TMapRouteProps> = ({ scheduleId }) => {
  const webviewRef = useRef<WebView | null>(null);
  const [markers, setMarkers] = useState<LocationData[]>([]);
  const [routeType, setRouteType] = useState<RouteType>("car"); // 기본값: 자동차 경로
  const [initialLocation, setInitialLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ✅ 현재 위치 가져오기 (WebView → React Native)
  const handleGetCurrentLocation = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("위치 권한이 거부되었습니다.");
        Alert.alert("권한 오류", "위치 접근 권한이 필요합니다.");
        return;
      }

      // 현재 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;
      console.log("현재 위치:", latitude, longitude);

      // WebView에 현재 위치 전달
      webviewRef.current?.injectJavaScript(`
      updateUserLocation(${latitude}, ${longitude});
      true;
    `);
    } catch (error) {
      console.error("내 위치 가져오기 실패:", error);
      Alert.alert("위치 오류", "현재 위치를 가져올 수 없습니다.");
    }
  };

  const decideRouteType = (transportationArr: string[]): RouteType => {
    // 먼저 "자가용" 확인
    if (transportationArr.includes("자가용")) return "car";
    // 그다음 "택시"
    if (transportationArr.includes("택시")) return "taxi";
    // 그다음 "대중교통"
    if (transportationArr.includes("대중교통")) return "transit";
    // 마지막 "걷기"
    if (transportationArr.includes("걷기")) return "pedestrian";
    // 기본값
    return "car";
  };

  useEffect(() => {
    // 1) getSchedules()로 일정 목록 가져오기
    const fetchSchedule = async () => {
      if (!scheduleId) {
        console.error("❌ scheduleId가 없음!");
        return;
      }
      const schedule = await fetchScheduleById(scheduleId);
      // console.log("✅ Raw API Response:", schedule); // 🔍 **반환값을 직접 확인**

      if (!schedule) {
        console.log("❌ 해당 scheduleId를 가진 일정이 없습니다:", scheduleId);
        return;
      }
      console.log("✅ itinerary 존재 확인:", schedule.itinerary);

      const parsedLocations: LocationData[] = [];
      let finalTransportation: string[] = [];

      if (Array.isArray(schedule.transportation)) {
        finalTransportation = finalTransportation.concat(
          schedule.transportation
        );
      }

      if (Array.isArray(schedule.days)) {
        console.log("📅 일정 `days` 데이터:", schedule.days);

        schedule.days.forEach((day, dayIndex) => {
          console.log(`📌 Day ${dayIndex + 1}:`, day);

          // 🔥 activities 대신 places 사용
          if (Array.isArray(day.places)) {
            day.places.forEach((place, placeIndex) => {
              console.log(`📍 Place ${placeIndex + 1}:`, place);

              if (place.coords && place.coords.lat && place.coords.lng) {
                parsedLocations.push({
                  lat: place.coords.lat,
                  lng: place.coords.lng,
                  title: place.title || "No title", // 🔥 place.title 사용
                });
              } else {
                console.log(
                  `⚠️ 장소 ${placeIndex + 1}에 coords 정보 없음!`,
                  place
                );
              }
            });
          } else {
            console.log("⚠️ places가 배열이 아님!", day.places);
          }
        });
      } else {
        console.log("⚠️ `days` 필드가 존재하지 않음!");
      }

      // 교통수단 우선순위 결정
      const finalType = decideRouteType(finalTransportation);
      setRouteType(finalType);
      console.log("결정된 routeType:", finalType);
      // 상태 저장
      setMarkers(parsedLocations);

      // 콘솔로 확인 (사용자 요구사항)
      console.log("Parsed locations for map:", parsedLocations);

      // ✅ TMap 경로 요청 함수 호출
      requestRoute(finalType, parsedLocations);

      // 지도 WebView에 주입 (조금 기다렸다가 or onLoadEnd에서 호출 가능)
      setTimeout(() => {
        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            updateMarkers(${JSON.stringify(parsedLocations)});
            ${
              parsedLocations.length > 0
                ? `updateUserLocation(${parsedLocations[0].lat}, ${parsedLocations[0].lng});`
                : ""
            }
            requestRoute("${finalType}", ${JSON.stringify(parsedLocations)});
            true;
          `);
        }
      }, 500);
    };

    fetchSchedule();
  }, [scheduleId]);

  // 🚀 WebView 로드 완료 후 Tmapv2 확인
  useEffect(() => {
    const checkTmapLoaded = setTimeout(() => {
      webviewRef.current?.injectJavaScript(`
        if (window.Tmapv2) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "info", message: "✅ Tmapv2 Loaded!" }));
        }
      `);
    }, 2000); // ✅ 2초 뒤에 한 번만 실행

    return () => clearTimeout(checkTmapLoaded); // ✅ 실행 후 클리어
  }, []);

  // 🚀 TMap 경로 API 호출하여 실제 경로 가져오기
  const requestRoute = async (
    routeType: RouteType,
    locations: LocationData[]
  ) => {
    if (!locations || locations.length < 2) {
      console.log("경로 계산할 최소 2개 좌표가 필요합니다.");
      return;
    }

    const start = locations[0]; // 출발지
    const end = locations[locations.length - 1]; // 도착지

    console.log(
      `[WebView] routeType: ${routeType}, Start: ${start}, End: ${end}`
    );

    // 🛠️ TMap API URL 설정
    let apiUrl =
      routeType === "car"
        ? "https://apis.openapi.sk.com/tmap/routes?version=1&format=json"
        : routeType === "pedestrian"
        ? "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json"
        : "https://apis.openapi.sk.com/tmap/routes/transit?version=1&format=json"; // 대중교통 추가

    try {
      const requestBody: any = {
        startX: start.lng.toString(),
        startY: start.lat.toString(),
        endX: end.lng.toString(),
        endY: end.lat.toString(),
        reqCoordType: "WGS84GEO",
        resCoordType: "EPSG3857",
        startName: "출발지",
        endName: "도착지",
        searchOption: "0", // 교통최적 경로로
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          appKey: TMAP_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const json = await response.json();
      // console.log("📍 TMap 경로 응답 데이터:", json);

      if (!json.features) {
        console.log("⚠️ TMap 응답에서 경로 데이터가 없음!");
        return;
      }

      // ✅ EPSG3857 좌표 저장
      const pathEPSG3857 = json.features
        .filter((feature: any) => feature.geometry.type === "LineString")
        .flatMap((feature: any) =>
          feature.geometry.coordinates.map((coord: any) => ({
            lat: coord[1],
            lng: coord[0],
          }))
        );

      // console.log("🚀 변환 전 EPSG3857 좌표:", pathEPSG3857);

      // ✅ WebView에 EPSG3857 좌표를 전달하여 변환하게 함
      webviewRef.current?.injectJavaScript(`
    convertRouteCoordinates(${JSON.stringify(pathEPSG3857)});
    true;
  `);
    } catch (error) {
      console.error("❌ TMap 경로 탐색 API 호출 실패:", error);
    }
  };

  useEffect(() => {
    if (markers.length > 1) {
      // && !isRouteUpdated
      console.log("🚀 WebView에 `updateRoute()` 전달! markers:", markers);

      webviewRef.current?.injectJavaScript(`
        if (window.currentRoute !== JSON.stringify(${JSON.stringify(
          markers
        )})) {
          console.log("🚀 WebView에서 updateRoute 실행 요청!");
          window.currentRoute = JSON.stringify(${JSON.stringify(markers)});
          updateRoute(${JSON.stringify(markers)});
        }
        true;
      `);

      // setIsRouteUpdated(true); // ✅ 한 번만 실행하도록 설정
    }
  }, [markers]);

  // ✅ WebView에서 Tmapv2가 정상적으로 로드되었는지 React Native에서 확인
  const onMessage = (event: any) => {
    try {
      const rawData = event.nativeEvent.data;
      const message = JSON.parse(rawData); // JSON 파싱

      // ✅ JSON 형식인지 먼저 확인
      if (typeof rawData !== "string" || !rawData.startsWith("{")) {
        console.warn("⚠️ WebView에서 비 JSON 메시지 수신:", rawData);
        return;
      }
      if (message.type === "getCurrentLocation") {
        handleGetCurrentLocation(); // 위치 가져오기 함수 호출
        return;
      }

      if (message.type === "convertedRoute") {
        // console.log("✅ 변환된 WGS84 좌표 수신:", message.data);

        webviewRef.current?.injectJavaScript(`
          if (window.currentRoute !== JSON.stringify(${JSON.stringify(
            message.data
          )})) {
            console.log("🚀 WebView에서 updateRoute 실행 시작!");
            window.currentRoute = JSON.stringify(${JSON.stringify(
              message.data
            )});
            updateRoute(${JSON.stringify(message.data)});
          }
          true;
        `);
      } else if (message.type === "log") {
        console.log("📌 WebView 로그:", message.message);
      } else {
        console.log("INFO 메시지 수신:", message.message);
      }
    } catch (err) {
      console.error(
        "❌ WebView 메시지 파싱 실패:",
        err,
        "수신된 데이터:",
        event.nativeEvent.data
      );
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- TMap v2 스크립트 -->
        <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_API_KEY}"></script>
        <style>
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
          #map { width: 100%; height: 100%; }
          .current-location-button {
            position: absolute;
            bottom: 40px;
            left: 15px;
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 24px;
            box-shadow: 0 2px 6px rgba(87, 87, 87, 0.28);
            cursor: pointer;
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            padding: 8px;
          }
          .current-location-button:hover {
            background-color: #f5f5f5;
          }
          .current-location-button svg {
          width: 24px;
          height: 24px;
          fill:rgb(8, 9, 10);
          // transform: rotate(-45deg);
          }
          .button {
            position: absolute;
            width: 30px;
            height: 30px;
            font-size: 18px;
            text-align: center;
            cursor: pointer;
            background-color: white;
            border: 1px solid black;
            border-radius: 5px;
          }
          #zoomInBtn { top: 10px; right: 10px; }
          #zoomOutBtn { top: 50px; right: 10px; }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <!-- 현재 위치 버튼 -->
        <button id="currentLocationBtn" class="current-location-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.891 2.006L20.997 2L21.127 2.008L21.217 2.024L21.34 2.059L21.447 2.105L21.547 2.162L21.637 2.229L21.719 2.304L21.771 2.363L21.853 2.479L21.905 2.575C21.9517 2.675 21.9817 2.78033 21.995 2.891L22 2.997C22 3.07233 21.992 3.14567 21.976 3.217L21.941 3.34L15.409 21.417C15.2852 21.6866 15.0866 21.9149 14.8368 22.075C14.5871 22.2351 14.2966 22.3201 14 22.32C13.7329 22.3206 13.4702 22.2521 13.2373 22.1212C13.0045 21.9903 12.8094 21.8015 12.671 21.573L12.606 21.446L9.25399 14.744L2.58399 11.408C2.33719 11.2951 2.12436 11.1194 1.96677 10.8985C1.80918 10.6775 1.71236 10.4191 1.68599 10.149L1.67999 10C1.67999 9.44 1.98099 8.928 2.52099 8.63L2.66099 8.56L20.678 2.054L20.784 2.024L20.891 2.006Z" />
          </svg>
        </button>
        <button id="zoomInBtn" class="button">+</button>
        <button id="zoomOutBtn" class="button">-</button>

        <script>
          var map, markerObjs = [], polyline;
          var userMarker, outerCircle, innerCircle, lastKnownLocation;
          
          // 지도 초기화
          function initTmap() {
            map = new Tmapv2.Map("map", {
              center: new Tmapv2.LatLng(37.5652045, 126.98702028),
              width: "100%",
              height: "100%",
              zoom: 15
            });

            document.getElementById("currentLocationBtn").addEventListener("click", function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "getCurrentLocation" }));
            });

            document.getElementById("zoomInBtn").addEventListener("click", function() {
              map.setZoom(map.getZoom() + 1);
            });

            document.getElementById("zoomOutBtn").addEventListener("click", function() {
              map.setZoom(map.getZoom() - 1);
            });
          }

          // updateMarkers: lat, lng, title 기반으로 마커 생성
          function updateMarkers(locations) {

            markerObjs.forEach(m => m.setMap(null));
            markerObjs = [];

            locations.forEach(loc => {
              var marker = new Tmapv2.Marker({
                position: new Tmapv2.LatLng(loc.lat, loc.lng),
                map: map
              });
              marker.label = loc.title || "No Title";

              markerObjs.push(marker);
            });        
          }

            function updateRoute(routePath) {
              console.log("🚀 WebView updateRoute() 실행됨", routePath);

              if (polyline) {
                console.log("🚀 기존 경로 제거 후 새 경로 적용");
                polyline.setMap(null);
                polyline = null;  // ✅ 기존 경로 객체를 완전히 초기화
              }

              // ✅ 좌표 개수가 2개 이상인지 확인
              if (routePath.length < 2) {
                console.log("⚠️ updateRoute: 경로 데이터 부족으로 실행 불가");
                return;
              }

              polyline = new Tmapv2.Polyline({
                path: routePath.map(loc => new Tmapv2.LatLng(loc.lat, loc.lng)),
                strokeColor: "#FF0000",
                strokeWeight: 6,
                map: map,
              });

              // 🚀 지도 중심을 첫 경로 위치로 이동
              if (routePath.length > 0) {
                map.setCenter(new Tmapv2.LatLng(routePath[0].lat, routePath[0].lng));
                map.setZoom(14);
              }

              console.log("✅ WebView에서 updateRoute 실행 완료!");

              // ✅ React Native로 JSON 형식으로만 postMessage
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "log",
                message: "✅ updateRoute 실행 완료"
              }));
            }  
            
          function convertRouteCoordinates(epsg3857Coords) {
            if (!window.Tmapv2) {
              console.error("❌ Tmapv2 객체가 없습니다! 좌표 변환 불가능");
              return;
            }

            console.log("🔍 WebView 내 좌표 변환 시작:", epsg3857Coords);

            var convertedPath = epsg3857Coords.map(coord => {
              try {
                var point = new Tmapv2.Point(coord.lng, coord.lat);
                var converted = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(point);
                return { lat: converted._lat, lng: converted._lng };
              } catch (err) {
                console.error("❌ 좌표 변환 실패:", err);
                return { lat: coord.lat, lng: coord.lng }; // 변환 실패 시 원본 좌표 사용
              }
            });

            //console.log("✅ 변환된 WGS84 좌표:", convertedPath);

            // ✅ 변환된 좌표를 React Native로 전달
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "convertedRoute",
              data: convertedPath
            }));
          }

           // ====== 마커 & 원만 업데이트 (지도 중심 이동 X) ======
          function updateUserMarker(lat, lng) {
            lastKnownLocation = { lat: lat, lng: lng };
            var userLocation = new Tmapv2.LatLng(lat, lng);
            if (userMarker) userMarker.setMap(null);
            if (outerCircle) outerCircle.setMap(null);
            if (innerCircle) innerCircle.setMap(null);
            outerCircle = new Tmapv2.Circle({
              center: userLocation,
              radius: 24,
              fillColor: "#4A90E2",
              fillOpacity: 0.15,
              strokeColor: "#4A90E2",
              strokeWeight: 1,
              map: map
            });
            innerCircle = new Tmapv2.Circle({
              center: userLocation,
              radius: 12,
              fillColor: "#005EFF",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              map: map
            });
            userMarker = new Tmapv2.Marker({
              position: userLocation,
              icon: "https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png",
              map: map,
              title: "현재 위치"
            });
          }

          // ====== 마커 & 원 업데이트 후 지도 중심 이동 ======
          function updateUserLocation(lat, lng) {
            updateUserMarker(lat, lng);
            map.setCenter(new Tmapv2.LatLng(lat, lng));
          }

        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => {
          console.log("✅ WebView 로드 완료! initTmap() 호출");
          webviewRef.current?.injectJavaScript("initTmap();");
        }}
        onMessage={onMessage}
      />
    </View>
  );
};

export default TMapRoute;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
