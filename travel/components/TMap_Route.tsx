import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { fetchScheduleById } from "../api/loginapi";
import * as Location from "expo-location"; // Expo Location 임포트
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { Image } from "react-native";

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
  selectedDate?: string | null; // 날짜 선택 값 (없으면 전체 보기)
};

const TMapRoute: React.FC<TMapRouteProps> = ({ scheduleId, selectedDate }) => {
  const webviewRef = useRef<WebView | null>(null);
  const [markers, setMarkers] = useState<LocationData[]>([]);
  const [routeType, setRouteType] = useState<RouteType>("car"); // 기본값: 자동차 경로
  // const [initialLocation, setInitialLocation] = useState<{
  //   latitude: number;
  //   longitude: number;
  // } | null>(null);
  // const [location, setLocation] = useState<{
  //   latitude: number;
  //   longitude: number;
  // } | null>(null);
  const [base64Marker, setBase64Marker] = useState<string | null>(null);

  // Base64 변환 함수
  const getBase64Image = async (imagePath: number): Promise<string | null> => {
    try {
      const asset = Asset.fromModule(imagePath);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (!uri) {
        console.error("이미지 경로를 찾을 수 없습니다.");
        return null;
      }
      // **백틱으로 감싸야 함**: `return \`data:image/png;base64,\${base64}\`;`
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Base64 변환 실패:", error);
      return null;
    }
  };

  // WebView에 전달할 Base64 이미지
  useEffect(() => {
    (async () => {
      const base64 = await getBase64Image(require("../assets/pin_marker.png"));
      setBase64Marker(base64);
    })();
  }, []);

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

  // 일정 markers에 저장, 경유지 경로 요청청
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!scheduleId) {
        console.error("❌ scheduleId가 없음!");
        return;
      }
      const schedule = await fetchScheduleById(scheduleId);
      if (!schedule) {
        console.log("❌ 해당 scheduleId를 가진 일정이 없습니다:", scheduleId);
        return;
      }

      const parsedLocations: LocationData[] = [];
      let finalTransportation: string[] = [];

      // 1) 원본 전체 일정 획득
      if (Array.isArray(schedule.transportation)) {
        finalTransportation = finalTransportation.concat(
          schedule.transportation
        );
      }

      console.log("📌 selectedDate 변경됨:", selectedDate);

      // 2) 날짜별 (schedule.days) 순회
      if (Array.isArray(schedule.days)) {
        schedule.days.forEach((day, dayIndex) => {
          if (selectedDate && day.date !== selectedDate) {
            return; // 날짜 필터
          }
          console.log(`📌 Day ${dayIndex + 1}:`, day);
          if (Array.isArray(day.places)) {
            day.places.forEach((place, placeIndex) => {
              console.log(`📍 Place ${placeIndex + 1}:`, place);
              if (place.coords?.lat && place.coords?.lng) {
                parsedLocations.push({
                  lat: place.coords.lat,
                  lng: place.coords.lng,
                  title: place.title || "No title",
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

      console.log("📌 필터링된 장소 개수:", parsedLocations.length);

      if (parsedLocations.length === 0) {
        console.warn(
          "❌ 필터링된 장소가 없습니다! 지도 업데이트를 건너뜁니다."
        );
        return;
      }

      // 교통수단 결정
      const finalType = decideRouteType(finalTransportation);
      setRouteType(finalType);
      console.log("결정된 routeType:", finalType);

      setMarkers(parsedLocations);
      console.log("Parsed locations for map:", parsedLocations);

      // TMap 경로 요청
      requestRoute(finalType, parsedLocations);

      // WebView로 markers 전달
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
  }, [scheduleId, selectedDate]);

  // 🚀 WebView 로드 완료 후 Tmapv2 확인
  useEffect(() => {
    const checkTmapLoaded = setTimeout(() => {
      webviewRef.current?.injectJavaScript(`
        if (window.Tmapv2) {
          console.log("✅ Tmapv2 로드 성공!");
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "info", message: "✅ Tmapv2 Loaded!" }));
        } else {
          console.error("❌ Tmapv2 로드 실패!");
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "❌ Tmapv2 Not Loaded!" }));
        }
        true;
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
    const waypoints = locations.slice(1, locations.length - 1);
    const passList = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join("_");

    // 🛠️ TMap API URL 설정
    let apiUrl =
      routeType === "car"
        ? "https://apis.openapi.sk.com/tmap/routes?version=1&format=json"
        : routeType === "pedestrian"
        ? "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json"
        : "https://apis.openapi.sk.com/tmap/routes/transit?version=1&format=json"; // 대중교통 추가

    try {
      const requestBody = {
        startX: start.lng.toString(),
        startY: start.lat.toString(),
        endX: end.lng.toString(),
        endY: end.lat.toString(),
        passList,
        reqCoordType: "WGS84GEO",
        resCoordType: "EPSG3857",
        startName: "출발지",
        endName: "도착지",
        searchOption: "0",
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

      if (!json.features) {
        console.log("⚠️ TMap 응답에서 경로 데이터가 없음!");
        return;
      }

      // ✅ EPSG3857 좌표 저장
      const pathEPSG3857: { lat: number; lng: number }[] = [];
      json.features.forEach((feature: any) => {
        if (feature.geometry.type === "LineString") {
          if (feature.properties.description?.includes("경유지와 연결된")) {
            console.log("🔥 가상 라인은 제외합니다:", feature.properties);
            return;
          }
          feature.geometry.coordinates.forEach((coord: any) => {
            pathEPSG3857.push({
              lat: coord[1],
              lng: coord[0],
            });
          });
        }
      });

      // WebView에 좌표 전달 -> convertRouteCoordinates() 호출
      webviewRef.current?.injectJavaScript(`
        convertRouteCoordinates(${JSON.stringify(pathEPSG3857)});
        true;
      `);
    } catch (error) {
      console.error("❌ TMap 경로 탐색 API 호출 실패:", error);
    }
  };

  // **마커 i 클릭 시 => i~(i+1)만 경로 표시하기 위한 간단 도우미** (LineString 좌표 추출)
  // 필요하다면 fetch 대신 직접 polyline 그려도 됨.
  const extractLineString = (
    features: any[]
  ): { lat: number; lng: number }[] => {
    const results: { lat: number; lng: number }[] = [];
    features.forEach((f) => {
      if (f.geometry.type === "LineString") {
        f.geometry.coordinates.forEach((coord: number[]) => {
          results.push({ lat: coord[1], lng: coord[0] });
        });
      }
    });
    return results;
  };

  useEffect(() => {
    if (markers.length > 1) {
      console.log("🔔 마커(경로 데이터) 변경:", markers);

      const markersJSON = JSON.stringify(markers);

      webviewRef.current?.injectJavaScript(
        "try {" +
          "if (window.currentRoute !== '" +
          markersJSON +
          "') {" +
          "console.log('🚀 [디버깅] updateRoute 실행 요청!');" +
          "window.currentRoute = '" +
          markersJSON +
          "';" +
          "updateRoute(" +
          markersJSON +
          ");" +
          "} else {" +
          "console.log('⚠️ [디버깅] 기존 경로와 동일, updateRoute 실행 안 함.');" +
          "}" +
          "} catch (err) {" +
          "console.error('🚨 updateRoute 실행 중 오류 발생:', err);" +
          "}" +
          "true;"
      );
    }
  }, [markers]);

  // ✅ WebView에서 Tmapv2가 정상적으로 로드되었는지 React Native에서 확인
  const onMessage = (event: any) => {
    try {
      const rawData = event.nativeEvent.data;
      const message = JSON.parse(rawData);

      // ✅ updateRoute 실행 전후 로그 추가
      if (
        message.type === "log" &&
        message.message.includes("updateRoute 실행")
      ) {
        console.log("🛠 updateRoute 실행 로그:", message);
      }

      // ✅ WebView에서 발생하는 모든 오류를 React Native에서 확인할 수 있도록 변경
      if (message.type === "error") {
        console.log("🔥 WebView 오류 발생:", message.message);
      }

      // ✅ 기존 오류 메시지와 함께 스택 트레이스 출력
      if (
        message.type === "error" &&
        message.message.includes("Script error")
      ) {
        console.log("🚨 WebView Script 오류 발생! 스택 트레이스 확인 필요.");
      }

      // 마커 클릭
      else if (message.type === "markerClicked") {
        Alert.alert(
          "📍 마커 클릭됨",
          "번호: " + message.index + "\n장소: " + message.title
        );
        console.log("✅ 마커 클릭 이벤트 정상 동작: ", message);
      }

      // 현재 위치 가져오기
      else if (message.type === "getCurrentLocation") {
        handleGetCurrentLocation();
      }
      // 단순 info
      else if (message.type === "info") {
        console.log("INFO:", message.message);
      }
      // 경로 좌표 변환 완료 -> updateRoute
      else if (message.type === "convertedRoute") {
        // console.log("✅ 좌표 변환 완료:", message.data);

        webviewRef.current?.injectJavaScript(`
          if (window.polyline) {
            window.polyline.setMap(null);
            delete window.polyline;
          }
          window.polyline = updateRoute(${JSON.stringify(message.data)});
          console.log("✅ [WebView] updateRoute 실행 완료");
          true;
        `);
      } else {
        console.log("📩 WebView 기타 메시지:", message);
      }
    } catch (err) {
      console.warn("⚠️ WebView 메시지 파싱 실패:", event.nativeEvent.data);
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
          window.onerror = function(msg, url, line, col, error) {
            // 혹은 console.error 써도 됨
            const errorMsg = "🚨 Uncaught Error: " + msg + ", line:" + line + ", col:" + col;
            console.log(errorMsg); // 이건 window.ReactNativeWebView.postMessage와 연동되어 콘솔에 찍힐 것

            if (error && error.stack) {
              console.error("🛠 Error Stack:", error.stack);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "error",
                message: "🛠 Error Stack: " + error.stack
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "error",
                message: "🚨 Uncaught Error: " + msg + ", line:" + line + ", col:" + col
              }));
            }           
          };

          console.log = (function (oldLog) {
            return function (message) {
              oldLog(message);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "log", message: message }));
            };
          })(console.log);

          console.log("🔥 HTML 스크립트 시작!");

          var map, markerObjs = [], polyline;
          var userMarker, outerCircle, innerCircle, lastKnownLocation;
          
          // 전역 initTmap() 선언
          window.initTmap = function() {
            console.log("✅ initTmap() 실행됨!");

            // ==== TMap Map 객체 생성 ====
            map = new Tmapv2.Map("map", {
              center: new Tmapv2.LatLng(37.5652045, 126.98702028),
              width: "100%",
              height: "100%",
              zoom: 15
            });

            document.getElementById("currentLocationBtn")
              .addEventListener("click", function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "getCurrentLocation" }));
              });

            document.getElementById("zoomInBtn")
              .addEventListener("click", function() { map.setZoom(map.getZoom() + 1); });

            document.getElementById("zoomOutBtn")
              .addEventListener("click", function() { map.setZoom(map.getZoom() - 1); });

            // Tmapv2 로드 체크
            setTimeout(() => {
              if (window.Tmapv2) {
                console.log("✅ Tmapv2 로드 성공!");
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: "info", message: "✅ Tmapv2 Loaded!" })
                );
              } else {
                console.error("❌ Tmapv2 로드 실패!");
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: "error", message: "❌ Tmapv2 Not Loaded!" })
                );
              }
            }, 2000);
          };

          // ✅ 마커 크기 동적 조정 함수
          function getMarkerSizeByZoom(zoomLevel) {
            if (zoomLevel >= 17) return 48; // 줌인 시 큰 마커
            if (zoomLevel >= 14) return 36; // 기본 마커 크기
            return 24; // 줌아웃 시 작은 마커
          }

          // ✅ 줌 레벨에 따라 마커 크기를 동적으로 생성
          function createNumberedMarkerImage(number, zoomLevel) {
            return new Promise((resolve) => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                  console.error("❌ 캔버스 컨텍스트를 가져올 수 없습니다.");
                  resolve(""); // 에러 방지용 빈 데이터 반환
                  return;
                }

                const size = getMarkerSizeByZoom(zoomLevel); // 현재 줌 레벨 기준 크기 설정
                canvas.width = size;
                canvas.height = size;

                const img = new Image();
                img.src = "${base64Marker || ""}";

                img.onload = () => {
                  ctx.drawImage(img, 0, 0, size, size); // ✅ 크기에 맞춰 이미지 조정

                  ctx.fillStyle = "white"; // ✅ 숫자 색상
                  ctx.strokeStyle = "black"; // ✅ 외곽선 색상
                  ctx.lineWidth = size * 0.08; // ✅ 외곽선 두께
                  const fontSize = size / 1.5; // 원하는 비율로 조절
                  ctx.font = "bold " + fontSize + "px Arial"; 
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";

                  const x = canvas.width / 2;
                  const y = canvas.height / 2;

                  // ✅ 3D 효과 (그림자 효과 추가)
                  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                  ctx.shadowOffsetX = size * 0.05;
                  ctx.shadowOffsetY = size * 0.05;
                  ctx.shadowBlur = size * 0.1;

                  // ✅ 외곽선 먼저 그리기 (더 가독성 높아짐)
                  ctx.strokeText(number.toString(), x, y);

                  // ✅ 본문 텍스트 (위에 덮어서 가독성 증가)
                  ctx.fillText(number.toString(), x, y);

                  resolve(canvas.toDataURL());
                };

                img.onerror = () => {
                  console.error("❌ 이미지 로드 실패:", img.src);
                  resolve(""); // 에러 발생 시 빈 문자열 반환
                };
                } catch (error) {
                  console.error("🚨 createNumberedMarkerImage() 내부 오류 발생:", error);
                resolve(""); // 빈 데이터 반환하여 크래시 방지
              }
            });
          }

          // updateMarkers 등 TMap 관련 함수
          async function updateMarkers(locations) {
            markerObjs.forEach(m => m.setMap(null));
            markerObjs = [];

            console.log("📌 updateMarkers 실행됨. locations 개수:", locations.length);

            try {
              for (let idx = 0; idx < locations.length; idx++) {
                const loc = locations[idx];  
                console.log("🛠 마커 생성 시작: ", loc);

                const markerImageUrl = await createNumberedMarkerImage(idx + 1, map.getZoom());

                if (!markerImageUrl) {
                  console.error("❌ 마커 이미지 생성 실패! index:", idx + 1);
                  continue; // 이미지 로드 실패 시 마커 생성 스킵
                }

              
                var marker = new Tmapv2.Marker({
                  position: new Tmapv2.LatLng(loc.lat, loc.lng),
                  map: map,
                  // label 속성 (문자열 형태로 가능)
                  icon: markerImageUrl,  // ✅ 숫자가 포함된 마커 사용 
                });

                // ✅ InfoWindow 생성 (마커 클릭하면 정보 보이게)
                var infoWindow = new Tmapv2.InfoWindow({
                  position: new Tmapv2.LatLng(loc.lat, loc.lng),
                  content: "<div style='background:white; padding:5px; border-radius:5px; font-size:14px;'>"
                  + "📍 <b>" + (loc.title || "장소 정보 없음") + "</b>"
                  + "</div>",
                  border: "1px solid black",
                  type: 2, // 항상 열려있지 않도록 설정
                  map: null, // 초기에는 숨김 상태
                });

                console.log("📍 마커 생성 완료: ", loc.title);
                
                // ✅ 마커 클릭 이벤트 추가
                try{
                  marker.addListener("click", function () {
                    console.log("✅ 마커 클릭 이벤트 실행됨! 번호:", idx + 1, "장소:", loc.title);
                    alert("✅ 마커 클릭됨! " + loc.title); // 디버깅용
                    
                    markerObjs.forEach(m => {
                      if (m.infoWindow) {
                        m.infoWindow.setMap(null);
                      }
                    });

                    // 새로운 마커 정보창 열기
                    infoWindow.setMap(map);

                    console.log("📩 WebView → React Native: markerClicked 메시지 전송");                
                  // ✅ React Native로 클릭된 마커 정보 전달
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: "markerClicked",
                      index: idx + 1,
                      title: loc.title
                    }));
                  });
                } catch (error) {
                  console.error("🚨 마커 클릭 이벤트 추가 실패! index:", idx + 1, "Error:", error);
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "🚨 마커 클릭 이벤트 오류: " + error.message }));
                }  
                
                marker.infoWindow = infoWindow;
                markerObjs.push(marker);
              }
            } catch (error) {
                console.error("🚨 updateMarkers() 내부 오류 발생:", error);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "🚨 updateMarkers() 오류 발생: " + error.message }));
              }
            }

          // updateRoute: 경로 데이터를 받아서 Polyline 생성
            function updateRoute(routePath) {
            console.log("🚀 [디버깅] updateRoute() 실행됨", routePath);

            if (!routePath || routePath.length < 2) {
              console.log("⚠️ [디버깅] updateRoute 실행 불가: 경로 데이터 부족");
              return null;
            }          

            try {

              // ✅ map 객체 확인 (map이 없으면 오류 발생 가능)
              if (!window.Tmapv2 || !map) {
                console.error("🚨 Tmapv2 또는 map 객체가 정의되지 않음! 경로 업데이트 불가");
                return null;
              }

              if (window.polyline) {
                console.log("🛑 기존 경로 삭제");
                try{
                window.polyline.setMap(null);
                delete window.polyline;
                window.polyline = null;
              } catch(err) {
               console.warn("🚨 기존 polyline 삭제 중 오류 발생:", err);
              }
}
              // ✅ Polyline 삭제 후 딜레이 추가 (100ms)
              setTimeout(() => {
                try {
                  var latLngPath = routePath.map(function(loc) {
                    return new Tmapv2.LatLng(loc.lat, loc.lng);
                  });

                  // ✅ 새 Polyline 생성 시 map이 유효한지 다시 체크
                  if (!map) {
                    console.error("🚨 map 객체가 삭제됨! updateRoute 실행 불가");
                    return;
                  }

              
              var latLngPath = routePath.map(function(loc) {
                return new Tmapv2.LatLng(loc.lat, loc.lng);
              });
              
              window.polyline = new Tmapv2.Polyline({
                path: latLngPath,
                strokeColor: "#FF0000",
                strokeWeight: 6,
                map: map
              });

              if (routePath.length > 0) {
                map.setCenter(new Tmapv2.LatLng(routePath[0].lat, routePath[0].lng));
                map.setZoom(14);
              }

              console.log("✅ updateRoute() 완료: 새 경로 생성");
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "log",
                message: "✅ updateRoute 실행 완료"
              }));
} catch (error) {
        console.error("🚨 updateRoute 실행 중 오류 발생:", error);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "error",
          message: "🚨 updateRoute 실행 중 오류: " + error.message
        }));
      }
    }, 100); // ✅ 100ms 딜레이 추가

              // return window.newPolyline;
            } catch (error) {
            console.error("🚨 updateRoute 실행 중 오류 발생:", error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "error",
              message: "🚨 updateRoute 실행 중 오류: " + error.message
            }));
            // return null;
            }            
          }
            
         
           // ====== 유저 위치 ======
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

            console.log("✅ 변환된 WGS84 좌표:", convertedPath);

            // ✅ 변환된 좌표를 React Native로 전달
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "convertedRoute",
              data: convertedPath
            }));
          }          

          initTmap(); // 그냥 스크립트 끝에서 바로 실행

          console.log("🔥 HTML 스크립트 끝!");
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
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        // *******************
        // [중요] onLoadEnd 에서 initTmap() 강제 호출은 "굳이" 안 해도 됨
        // 아래 코드는 "참고"용으로 남겨둬요. 실제로는 없어도 됨.
        // *******************
        onLoadEnd={() => {
          console.log(
            "✅ onLoadEnd 발생 - 여기서 굳이 initTmap()을 부를 필요는 없어요."
          );
          // setTimeout(() => {
          //   webviewRef.current?.injectJavaScript(`
          //     console.log("🔥 1.5초 후 initTmap() 실행 시도!");
          //     if (typeof initTmap === "function") {
          //       console.log("✅ initTmap()을 실행합니다!");
          //       initTmap();
          //     } else {
          //       console.error("❌ initTmap() 함수가 정의되지 않음!");
          //     }
          //     true;
          //   `);
          // }, 1500);
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
