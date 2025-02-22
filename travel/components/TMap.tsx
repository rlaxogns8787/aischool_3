import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";

interface LocationData {
  latitude: number;
  longitude: number;
}

const TMap: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [initialLocation, setInitialLocation] = useState<LocationData | null>(
    null
  );
  const webviewRef = useRef<WebView | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      try {
        // 1) 위치 권한 요청
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Permission to access location was denied");
          return;
        }

        // 2) 현재 위치 가져오기
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setInitialLocation(newLocation);
        setLocation(newLocation);

        // 3) 초기 지도 로드시, 현재 위치로 이동
        if (webviewRef.current) {
          webviewRef.current.injectJavaScript(`
            updateUserLocation(${newLocation.latitude}, ${newLocation.longitude});
            true;
          `);
        }

        // 4) 위치 변경 감지 (지도 중심은 이동하지 않도록 -> updateUserMarker())
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

            // 자동 업데이트 시 지도 중심 이동 없이 마커 & 원만 갱신
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                updateUserMarker(${updatedLocation.latitude}, ${updatedLocation.longitude});
                true;
              `);
            }
          }
        );
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();

    // cleanup
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // 지도 초기값
  const htmlContent = React.useMemo(() => {
    const lat = initialLocation?.latitude || 37.566481;
    const lng = initialLocation?.longitude || 126.985032;

    // 🔹 TMap v2용 스크립트: jsv2
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
            // transform: rotate(-45deg);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <button id="currentLocationBtn" class="current-location-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.891 2.006L20.997 2L21.127 2.008L21.217 2.024L21.34 2.059L21.447 2.105L21.547 2.162L21.637 2.229L21.719 2.304L21.771 2.363L21.853 2.479L21.905 2.575C21.9517 2.675 21.9817 2.78033 21.995 2.891L22 2.997C22 3.07233 21.992 3.14567 21.976 3.217L21.941 3.34L15.409 21.417C15.2852 21.6866 15.0866 21.9149 14.8368 22.075C14.5871 22.2351 14.2966 22.3201 14 22.32C13.7329 22.3206 13.4702 22.2521 13.2373 22.1212C13.0045 21.9903 12.8094 21.8015 12.671 21.573L12.606 21.446L9.25399 14.744L2.58399 11.408C2.33719 11.2951 2.12436 11.1194 1.96677 10.8985C1.80918 10.6775 1.71236 10.4191 1.68599 10.149L1.67999 10C1.67999 9.44 1.98099 8.928 2.52099 8.63L2.66099 8.56L20.678 2.054L20.784 2.024L20.891 2.006Z" />
          </svg></button>
        <script>
          var map;
          var userMarker;
          var outerCircle;    // 큰 원
          var innerCircle;    // 작은 원
          var lastKnownLocation;

          // ====== 지도 초기화 ======
          function initMap() {
            map = new Tmapv2.Map("map", {
              center: new Tmapv2.LatLng(${lat}, ${lng}),
              width: "100%",
              height: "100%",
              zoom: 16
            });

            // 현재 위치 버튼 이벤트
            document.getElementById("currentLocationBtn").addEventListener("click", function() {
              if (lastKnownLocation) {
                updateUserLocation(lastKnownLocation.lat, lastKnownLocation.lng);
                map.setZoom(16);
              }
            });
          }

          // ====== 마커 & 원만 업데이트 (지도 중심 이동 X) ======
          function updateUserMarker(lat, lng) {
            lastKnownLocation = { lat: lat, lng: lng };
            var userLocation = new Tmapv2.LatLng(lat, lng);

            // 기존 마커, 원 제거
            if (userMarker) userMarker.setMap(null);
            if (outerCircle) outerCircle.setMap(null);
            if (innerCircle) innerCircle.setMap(null);

            // 큰 원 (밝은 파란색)
            outerCircle = new Tmapv2.Circle({
              center: userLocation,
              radius: 24,
              fillColor: "#4A90E2",
              fillOpacity: 0.15,
              strokeColor: "#4A90E2",
              strokeWeight: 1,
              map: map
            });

            // 작은 원 (진한 파란색)
            innerCircle = new Tmapv2.Circle({
              center: userLocation,
              radius: 12,
              fillColor: "#005EFF",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              map: map
            });

            // 사용자 마커
            userMarker = new Tmapv2.Marker({
              position: userLocation,
              // offset / anchor 등은 일단 제거하여 pos0 에러 방지
              icon: "https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png",
              map: map,
              title: "현재 위치"
            });
          }

          // ====== 마커 & 원 업데이트 후 지도 중심 이동 (초기 / 버튼 클릭 시) ======
          function updateUserLocation(lat, lng) {
            updateUserMarker(lat, lng);
            var newCenter = new Tmapv2.LatLng(lat, lng);
            map.setCenter(newCenter);
          }

          // 맵 초기화
          initMap();
        </script>
      </body>
    </html>
    `;
  }, [initialLocation]);

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
        onError={(syntheticEvent) => {
          console.warn("WebView error:", syntheticEvent.nativeEvent);
        }}
        onMessage={(event) => {
          console.log("WebView message:", event.nativeEvent.data);
        }}
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
