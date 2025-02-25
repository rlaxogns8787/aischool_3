import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

// ✅ 일정 조회 API (예: TMap_Route.tsx 에서 가져옴)
import { fetchScheduleById } from "../api/loginapi";

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";

// 위치 데이터 구조
interface LocationData {
  lat: number;
  lng: number;
  title?: string;
}

// 교통수단 타입
type RouteType = "car" | "taxi" | "transit" | "pedestrian";

interface TMapProps {
  // 🔸 필요한 경우, props 로 scheduleId / selectedDate 를 전달받는다고 가정
  scheduleId: string;
  selectedDate?: string | null; // 날짜 미지정 시 null
}

// =========================================
// 통합된 TMap 컴포넌트
// =========================================
const TMap: React.FC<TMapProps> = ({ scheduleId, selectedDate }) => {
  // --------------------------
  // 1) 사용자 위치 (기존 TMap.tsx 로직)
  // --------------------------
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialLocation, setInitialLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const webviewRef = useRef<WebView | null>(null);
  const recenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------------------
  // 2) 일정 + 마커 + 경로
  // --------------------------
  const [markers, setMarkers] = useState<LocationData[]>([]); // 날짜 필터링된 장소 목록
  const [routeType, setRouteType] = useState<RouteType>("car"); // 교통수단 결정
  const [base64Marker, setBase64Marker] = useState<string | null>(null);

  // --------------------------
  // (A) 마운트 시 Base64 아이콘 준비
  // --------------------------
  const getBase64Image = async (imgPath: number): Promise<string | null> => {
    try {
      const asset = Asset.fromModule(imgPath);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (!uri) return null;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Base64 변환 실패:", error);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      const base64 = await getBase64Image(require("../assets/pin_marker.png"));
      setBase64Marker(base64);
    })();
  }, []);

  // --------------------------
  // (B) 스케줄 fetch + 날짜 필터링
  // --------------------------
  useEffect(() => {
    if (!scheduleId) return;

    const loadScheduleData = async () => {
      try {
        const schedule = await fetchScheduleById(scheduleId);
        console.log("스케줄 데이터: ", schedule); // 디버깅
        if (!schedule) {
          console.warn("❌ 해당 scheduleId에 대한 데이터가 없음:", scheduleId);
          return;
        }

        // 전체 교통수단 배열
        let transportationArr: string[] = Array.isArray(schedule.transportation)
          ? schedule.transportation
          : [];

        // (1) 날짜 필터하여 장소만 뽑기
        let parsedLocations: LocationData[] = [];

        if (Array.isArray(schedule.days)) {
          // 1) selectedDate가 유효한지 확인
          let validDateIndex = schedule.days.findIndex(
            (day: any) => day.date === selectedDate
          );

          // 2) 만약 validDateIndex < 0 이면 => 첫째 날(0번 index)로 처리
          if (validDateIndex < 0) validDateIndex = 0;

          // 3) 해당 날짜의 places
          const dayObj = schedule.days[validDateIndex];
          if (dayObj && Array.isArray(dayObj.places)) {
            dayObj.places.forEach((p: any) => {
              if (p.coords && p.coords.lat && p.coords.lng) {
                parsedLocations.push({
                  lat: p.coords.lat,
                  lng: p.coords.lng,
                  title: p.title || "No title",
                });
              }
            });
          }
        }

        // (2) 교통수단 -> routeType 결정
        const finalRouteType = decideRouteType(transportationArr);
        setRouteType(finalRouteType);

        // (3) state에 장소 세팅 -> WebView에 마커 표시
        setMarkers(parsedLocations);

        // (4) 경로 호출
        if (parsedLocations.length >= 2) {
          requestRoute(finalRouteType, parsedLocations);
        } else {
          console.warn("마커가 2개 미만이므로 경로를 표시할 수 없습니다.");
        }

        // WebView 쪽에 JS로 마커/경로 업데이트
        setTimeout(() => {
          if (webviewRef.current) {
            webviewRef.current.injectJavaScript(`
              updateMarkers(${JSON.stringify(parsedLocations)});
              ${
                parsedLocations.length > 0
                  ? `updateUserLocation(${parsedLocations[0].lat}, ${parsedLocations[0].lng});`
                  : ""
              }
              requestRoute("${finalRouteType}", ${JSON.stringify(
              parsedLocations
            )});
              true;
            `);
          }
        }, 500);
      } catch (error) {
        console.error("스케줄 가져오기 실패:", error);
      }
    };

    loadScheduleData();
  }, [scheduleId, selectedDate]);

  // --------------------------
  // (C) 교통수단 배열 => RouteType 결정
  // --------------------------
  const decideRouteType = (transportationArr: string[]): RouteType => {
    if (transportationArr.includes("자가용")) return "car";
    if (transportationArr.includes("택시")) return "taxi";
    if (transportationArr.includes("대중교통")) return "transit";
    if (transportationArr.includes("걷기")) return "pedestrian";
    return "car";
  };

  // --------------------------
  // (D) TMap Routes API 호출 + WebView로 전달
  // --------------------------
  const requestRoute = async (
    routeType: RouteType,
    locations: LocationData[]
  ) => {
    if (locations.length < 2) return;

    const start = locations[0];
    const end = locations[locations.length - 1];
    const waypoints = locations.slice(1, locations.length - 1);
    const passList = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join("_");

    // TMap API Endpoint
    let apiUrl =
      routeType === "car"
        ? "https://apis.openapi.sk.com/tmap/routes?version=1&format=json"
        : routeType === "pedestrian"
        ? "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json"
        : "https://apis.openapi.sk.com/tmap/routes/transit?version=1&format=json"; // (대중교통, 택시)

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
        console.log("경로 데이터가 없습니다!");
        return;
      }

      const pathEPSG3857: { lat: number; lng: number }[] = [];
      json.features.forEach((feature: any) => {
        if (feature.geometry.type === "LineString") {
          // (경유지 연결하는 가상 라인 등 필요한 경우 필터)
          feature.geometry.coordinates.forEach((coord: any) => {
            pathEPSG3857.push({
              lat: coord[1],
              lng: coord[0],
            });
          });
        }
      });

      // WebView에 EPSG3857 좌표 -> WGS84 변환 요청
      webviewRef.current?.injectJavaScript(`
        convertRouteCoordinates(${JSON.stringify(pathEPSG3857)});
        true;
      `);
    } catch (err) {
      console.error("경로 API 호출 오류:", err);
    }
  };

  // --------------------------
  // (E) WebView onMessage
  // --------------------------
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerClicked") {
        Alert.alert("마커 클릭됨", `번호: ${data.index}\n장소: ${data.title}`);
      } else if (data.type === "getCurrentLocation") {
        // WebView -> "현재 위치 가져와주세요" 메시지 => Expo Location 처리
        handleGetCurrentLocation();
      } else if (data.type === "convertedRoute") {
        // 경로 좌표 변환 완료 => updateRoute로 폴리라인 그리기
        webviewRef.current?.injectJavaScript(`
          if (window.polyline) {
            window.polyline.setMap(null);
            delete window.polyline;
          }
          window.polyline = updateRoute(${JSON.stringify(data.data)});
          true;
        `);
      } else {
        // 로그/에러/info 등
        if (data.type === "log") {
          console.log("[WebView log]:", data.message);
        } else if (data.type === "error") {
          console.log("[WebView error]:", data.message);
        } else {
          console.log("[WebView message]:", data);
        }
      }
    } catch (error) {
      console.warn("WebView 데이터 파싱 오류:", event.nativeEvent.data);
    }
  };

  // --------------------------
  // (F) WebView에서 "현재 위치" 요청시 처리
  // --------------------------
  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 오류", "위치 접근 권한이 필요합니다.");
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;
      // WebView 로 전달
      webviewRef.current?.injectJavaScript(`
        updateUserLocation(${latitude}, ${longitude});
        true;
      `);
    } catch (err) {
      console.error("현재 위치 가져오기 실패:", err);
    }
  };

  // --------------------------
  // (G) 앱 실행 후 사용자 위치 추적 (기존 TMap.tsx 로직)
  // --------------------------
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("위치 권한 거부됨");
          return;
        }
        // 현재 위치 1회 가져오기
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setInitialLocation(newLocation);
        setLocation(newLocation);

        // WebView에 초기 위치 반영
        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            updateUserLocation(${newLocation.latitude}, ${newLocation.longitude});
            true;
          `);
        }

        // watchPositionAsync
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (pos) => {
            const updatedLocation = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            setLocation(updatedLocation);

            // 지도 중심 이동 없이 사용자 마커만 갱신
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                updateUserMarker(${updatedLocation.latitude}, ${updatedLocation.longitude});
                true;
              `);
            }

            // 기존 타이머 클리어
            if (recenterTimeoutRef.current) {
              clearTimeout(recenterTimeoutRef.current);
            }
            // 3초 뒤에 다시 지도 중심 재설정
            recenterTimeoutRef.current = setTimeout(() => {
              if (webviewRef.current) {
                webviewRef.current.injectJavaScript(`
                  updateUserLocation(${updatedLocation.latitude}, ${updatedLocation.longitude});
                  true;
                `);
              }
            }, 3000);
          }
        );
      } catch (error) {
        console.error("location error:", error);
      }
    })();

    // cleanup
    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
    };
  }, []);

  // --------------------------
  // (H) WebView HTML
  // --------------------------
  const htmlContent = React.useMemo(() => {
    const lat = initialLocation?.latitude || 37.566481;
    const lng = initialLocation?.longitude || 126.985032;

    // 📍 TMap v2 스크립트
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            #zoomInBtn { top: 110px; right: 10px; }
            #zoomOutBtn { top: 150px; right: 10px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <button id="currentLocationBtn" class="current-location-button">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M20.891 2.006L20.997 2L21.127 2.008L21.217 2.024L21.34 2.059L21.447 2.105L21.547 2.162L21.637 2.229L21.719 2.304L21.771 2.363L21.853 2.479L21.905 2.575C21.9517 2.675 21.9817 2.78033 21.995 2.891L22 2.997C22 3.07233 21.992 3.14567 21.976 3.217L21.941 3.34L15.409 21.417C15.2852 21.6866 15.0866 21.9149 14.8368 22.075C14.5871 22.2351 14.2966 22.3201 14 22.32C13.7329 22.3206 13.4702 22.2521 13.2373 22.1212C13.0045 21.9903 12.8094 21.8015 12.671 21.573L12.606 21.446L9.25399 14.744L2.58399 11.408C2.33719 11.2951 2.12436 11.1194 1.96677 10.8985C1.80918 10.6775 1.71236 10.4191 1.68599 10.149L1.67999 10C1.67999 9.44 1.98099 8.928 2.52099 8.63L2.66099 8.56L20.678 2.054L20.784 2.024L20.891 2.006Z" />
            </svg>
          </button>
          <button id="zoomInBtn" class="button">+</button>
          <button id="zoomOutBtn" class="button">-</button>

          <script>
            // ========= 로깅/에러 처리 =========
            window.onerror = function(msg, url, line, col, error) {
              const errorMsg = "[JS 에러]: " + msg + " / line:" + line + " / col:" + col;
              console.log(errorMsg);
              if (error && error.stack) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: error.stack }));
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: errorMsg }));
              }
            };
            console.log = (function(oldLog){
              return function(...args){
                oldLog(...args);
                window.ReactNativeWebView.postMessage(JSON.stringify({type:"log", message: args.join(" ")}));
              };
            })(console.log);

            // ========= 지도 초기화 =========
            var map;
            var userMarker, outerCircle, innerCircle;
            var markerObjs = [];
            var lastKnownLocation;
            var polyline; // 경로 표시용

            function initMap() {
              map = new Tmapv2.Map("map", {
                center: new Tmapv2.LatLng(${lat}, ${lng}),
                width: "100%",
                height: "100%",
                zoom: 16
              });

              document.getElementById("currentLocationBtn").addEventListener("click", function(){
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "getCurrentLocation" }));
              });
              document.getElementById("zoomInBtn").addEventListener("click", function(){
                map.setZoom(map.getZoom() + 1);
              });
              document.getElementById("zoomOutBtn").addEventListener("click", function(){
                map.setZoom(map.getZoom() - 1);
              });
            }

            initMap();

            // ========= 유저 위치 관련 =========
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
            function updateUserLocation(lat, lng) {
              updateUserMarker(lat, lng);
              map.setCenter(new Tmapv2.LatLng(lat, lng));
            }

            // ========= 마커 생성 =========
            var base64Marker = "${base64Marker || ""}";

            // 1) 줌 레벨에 따른 사이즈
            function getMarkerSizeByZoom(zoomLevel){
              if (zoomLevel >= 17) return 48;
              if (zoomLevel >= 14) return 36;
              return 24;
            }

            // 2) 번호가 들어간 커스텀 마커 생성
            function createNumberedMarkerImage(number, zoomLevel) {
              return new Promise((resolve) => {
                const canvas = document.createElement("canvas");
                const size = getMarkerSizeByZoom(zoomLevel);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  resolve("");
                  return;
                }
                // 배경 이미지
                const img = new Image();
                img.src = base64Marker;
                img.onload = () => {
                  ctx.drawImage(img, 0, 0, size, size);
                  // 숫자
                  ctx.fillStyle = "white";
                  ctx.strokeStyle = "black";
                  ctx.lineWidth = size * 0.08;
                  const fontSize = size / 1.5;
                  ctx.font = "bold " + fontSize + "px Arial";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  const x = size / 2;
                  const y = size / 2;
                  // 외곽선
                  ctx.strokeText(number.toString(), x, y);
                  // 글자
                  ctx.fillText(number.toString(), x, y);
                  resolve(canvas.toDataURL());
                };
                img.onerror = () => resolve("");
              });
            }

            // ================================
            // 마커 업데이트
            // ================================
            async function updateMarkers(locations) {
              markerObjs.forEach(m => m.setMap(null));
              markerObjs = [];
              for (let i=0; i<locations.length; i++){
                const loc = locations[i];
                const numIcon = await createNumberedMarkerImage(i+1, map.getZoom());
                if (!numIcon) {
                  console.log("마커 아이콘 생성 실패:", i+1);
                  continue;
                }
                let marker = new Tmapv2.Marker({
                  position: new Tmapv2.LatLng(loc.lat, loc.lng),
                  map: map,
                  icon: numIcon
                });

                // InfoWindow
                let infoWindow = new Tmapv2.InfoWindow({
                  position: new Tmapv2.LatLng(loc.lat, loc.lng),
                  content: "<div style='background:white;padding:5px;border-radius:5px;'>"
                    + "<b>" + (loc.title || "No title") + "</b>"
                    + "</div>",
                  type: 2,
                  map: null
                });

                marker.addListener("click", function(){
                  // 모든 마커 info 닫기
                  markerObjs.forEach(m => {
                    if (m.infoWindow) m.infoWindow.setMap(null);
                  });
                  infoWindow.setMap(map);
                  // React Native로 클릭 정보 전송
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "markerClicked",
                    index: i+1,
                    title: loc.title
                  }));
                });

                marker.infoWindow = infoWindow;
                markerObjs.push(marker);
              }
            }

            // ================================
            // 경로 업데이트
            // ================================
            function updateRoute(routePath){
              console.log("updateRoute() 실행:", routePath.length, "개 좌표");
              if (polyline) {
                try { polyline.setMap(null); } catch(e){}
              }
              if (!routePath || routePath.length<2) return;
              let latLngPath = routePath.map(pt => new Tmapv2.LatLng(pt.lat, pt.lng));
              polyline = new Tmapv2.Polyline({
                path: latLngPath,
                strokeColor: "#FF0000",
                strokeWeight: 6,
                map: map
              });
              // 경로 중 첫 지점으로 지도 이동
              map.setCenter(latLngPath[0]);
              map.setZoom(14);
              return polyline;
            }

            // ================================
            // EPSG3857 -> WGS84 변환
            // ================================
            function convertRouteCoordinates(epsg3857Coords){
              if (!window.Tmapv2) return;
              let convertedPath = epsg3857Coords.map(coord => {
                try {
                  var point = new Tmapv2.Point(coord.lng, coord.lat);
                  var converted = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(point);
                  return { lat: converted._lat, lng: converted._lng };
                } catch(e){
                  return { lat: coord.lat, lng: coord.lng };
                }
              });
              // 변환 완료 -> RN에 전달
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "convertedRoute",
                data: convertedPath
              }));
            }

          </script>
        </body>
      </html>
    `;
  }, [initialLocation, base64Marker]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{ html: htmlContent }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        onMessage={onMessage}
        onError={(evt) => console.warn("WebView Error:", evt.nativeEvent)}
      />
    </View>
  );
};

export default TMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});
