import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const TMAP_API_KEY = "8ezbqMgfXa1X46n2tLOy7NtZv2HdDj03blR523oh";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TripInfo {
  itinerary: {
    // ✅ itinerary로 변경
    date: string;
    activities: {
      // ✅ places → activities 로 변경
      time: string;
      place: string;
      description: string;
      coords?: { lat: number; lng: number };
    }[];
  }[];
}

const TMapScreen = ({ tripInfo }: { tripInfo: TripInfo }) => {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log("🟢 TMapScreen - 받은 tripInfo:", tripInfo);
  }, [tripInfo]);

  const injectedJavaScript = `
    (function() {
      function logMessage(msg) {
        window.ReactNativeWebView.postMessage(msg);
      }

      logMessage("✅ TMAP script starting");

      var map;
      var existingPolyline = null;
      var markers = [];

      function initMap() {
        map = new Tmapv3.Map("map_div", {
          center: new Tmapv3.LatLng(37.5665, 126.978),
          width: "100%",
          height: "100%",
          zoom: 12
        });

        logMessage("✅ 지도 객체 생성 완료");

      // ✅ HTML을 이용한 확대/축소 버튼 추가
      var zoomControls = document.createElement("div");
      zoomControls.style.position = "absolute";
      zoomControls.style.top = "10px";
      zoomControls.style.right = "10px";
      zoomControls.style.zIndex = "1000";
      zoomControls.style.display = "flex";
      zoomControls.style.flexDirection = "column";
      zoomControls.style.background = "rgba(255, 255, 255, 0.8)";
      zoomControls.style.padding = "10px";
      zoomControls.style.borderRadius = "8px";
      zoomControls.style.boxShadow = "0px 0px 5px rgba(0,0,0,0.2)";

      var zoomInButton = document.createElement("button");
        zoomInButton.innerText = "+";
        zoomInButton.style.fontSize = "24px";  // ✅ 버튼 내부 글자 크기 증가
        zoomInButton.style.width = "50px";  // ✅ 버튼 크기 증가 (가로)
        zoomInButton.style.height = "50px";  // ✅ 버튼 크기 증가 (세로)
        zoomInButton.style.lineHeight = "50px";  // ✅ 텍스트 정렬
        zoomInButton.style.textAlign = "center";  // ✅ 텍스트 중앙 정렬
        zoomInButton.style.marginBottom = "10px";  // ✅ 버튼 간격 조정
        zoomInButton.style.border = "none";
        zoomInButton.style.cursor = "pointer";
        zoomInButton.style.borderRadius = "5px";  // ✅ 버튼도 둥글게
        zoomInButton.style.background = "#ffffff";  // ✅ 버튼 색상
        zoomInButton.style.boxShadow = "0px 2px 4px rgba(0,0,0,0.3)";  // ✅ 그림자 추가
        zoomInButton.onclick = function () {
          map.setZoom(map.getZoom() + 1);
        };

      var zoomOutButton = document.createElement("button");
        zoomOutButton.innerText = "−";
        zoomOutButton.style.fontSize = "24px";  // ✅ 버튼 내부 글자 크기 증가
        zoomOutButton.style.width = "50px";  // ✅ 버튼 크기 증가 (가로)
        zoomOutButton.style.height = "50px";  // ✅ 버튼 크기 증가 (세로)
        zoomOutButton.style.lineHeight = "50px";  // ✅ 텍스트 정렬
        zoomOutButton.style.textAlign = "center";  // ✅ 텍스트 중앙 정렬
        zoomOutButton.style.border = "none";
        zoomOutButton.style.cursor = "pointer";
        zoomOutButton.style.borderRadius = "5px";  // ✅ 버튼도 둥글게
        zoomOutButton.style.background = "#ffffff";  // ✅ 버튼 색상
        zoomOutButton.style.boxShadow = "0px 2px 4px rgba(0,0,0,0.3)";  // ✅ 그림자 추가
        zoomOutButton.onclick = function () {
          map.setZoom(map.getZoom() - 1);
        };

      zoomControls.appendChild(zoomInButton);
      zoomControls.appendChild(zoomOutButton);
      document.body.appendChild(zoomControls);
    }

      function drawMarkers(places) {
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        places.forEach(place => {
          if (!place.coords) return; // coords 없는 경우 제외
          var marker = new Tmapv3.Marker({
            position: new Tmapv3.LatLng(place.coords.lat, place.coords.lng),
            map: map
          });
          markers.push(marker);
        });

        logMessage("📍 모든 장소 마커 추가 완료");
      }

      function drawRoute(tripInfo) {
        if (!tripInfo.itinerary || !Array.isArray(tripInfo.itinerary)) {
          logMessage("❌ tripInfo.itinerary 데이터가 올바르지 않음!");
          return;
        }

        var places = tripInfo.itinerary.flatMap(day =>
          day.activities.map(activity => ({
            time: activity.time,
            title: activity.place,
            description: activity.description,
            coords: activity.coords
          }))
        ).filter(p => p.coords); // coords가 없는 항목 제외

        if (places.length < 2) {
          logMessage("⚠️ 최소 2개 이상의 장소가 필요 (현재: " + places.length + ")");
          return;
        }

        var startX = places[0].coords.lng;
        var startY = places[0].coords.lat;
        var endX = places[places.length - 1].coords.lng;
        var endY = places[places.length - 1].coords.lat;
        var passList = places.slice(1, -1).map(p => p.coords.lng + "," + p.coords.lat).join("_");

        logMessage("🚀 경로 요청 데이터: " + JSON.stringify({ startX, startY, endX, endY, passList }));

        $.ajax({
          method: "POST",
          headers: { "appKey": "${TMAP_API_KEY}" },
          url: "https://apis.openapi.sk.com/tmap/routes?version=1&format=json",
          data: JSON.stringify({
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            passList: passList || "",
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
            searchOption: "0"
           }),
          contentType: "application/json",
          success: function(response) {
            logMessage("✅ 경로 API 응답 받음");
            drawPolyline(response);
          },
          error: function(req, status, err) {
            logMessage("❌ 경로 요청 실패: " + err);
          }
        });
      }

      function drawPolyline(data) {
        var features = data.features;
        var pathArr = [];

        for (var i = 0; i < features.length; i++) {
          var geometry = features[i].geometry;
          if (geometry.type === "LineString") {
            var coords = geometry.coordinates;
            for (var j = 0; j < coords.length; j++) {
              var latLng = new Tmapv3.LatLng(coords[j][1], coords[j][0]);
              pathArr.push(latLng);
            }
          }
        }

        if (existingPolyline) {
          existingPolyline.setMap(null);
        }
        existingPolyline = new Tmapv3.Polyline({
          path: pathArr,
          strokeColor: "#FF0000",
          strokeWeight: 6,
          map: map
        });

        logMessage("✅ 경로(Line) 생성 완료");
      }

      window.addEventListener("message", function(event) {
        var tripInfo;
        try {
          tripInfo = JSON.parse(event.data);
          logMessage("📨 WebView received tripInfo: " + JSON.stringify(tripInfo));
        } catch (error) {
          logMessage("❌ tripInfo 데이터 파싱 실패: " + error.message);
          return;
        }

        if (!tripInfo.itinerary || tripInfo.itinerary.length === 0) {
          logMessage("❌ tripInfo.itinerary 데이터가 올바르지 않음!");
          return;
        }

        initMap();
        setTimeout(() => drawMarkers(tripInfo.itinerary.flatMap(day => 
          day.activities.map(activity => ({
            coords: activity.coords
          }))
        )), 2000);
        
        setTimeout(() => drawRoute(tripInfo), 3000);
      });
    })();
  `;

  return (
    <View style={styles.mapContainer}>
      <WebView
        ref={webviewRef}
        source={{
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
                <script src="https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=${TMAP_API_KEY}"></script>
                <style>
                  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                  #map_div { width: 100%; height: 100vh; }
                </style>
              </head>
              <body>
                <div id="map_div"></div>
                <script>${injectedJavaScript}</script>
              </body>
            </html>
          `,
        }}
        style={{ width: SCREEN_WIDTH, height: 400 }}
        onLoad={() => {
          webviewRef.current?.injectJavaScript(
            `window.postMessage('${JSON.stringify(tripInfo)}', '*');`
          );
        }}
        onMessage={(event) => {
          console.log("WebView message:", event.nativeEvent.data);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { width: "100%", height: 400 },
});

export default TMapScreen;
