import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Share,
} from "react-native";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Pagination from "react-native-snap-carousel/src/pagination/Pagination";
import CloseIcon from "../assets/close.svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmptyImage from "../assets/Image.svg"; // 기본 이미지 추가
import Svg, { SvgProps } from "react-native-svg"; // SVG 렌더링을 위한 라이브러리 추가
import defaultTravelImage1 from "../assets/default-travel-1.jpg"; // 이미지 파일 추가 필요
import defaultTravelImage2 from "../assets/default-travel-2.jpg"; // 이미지 파일 추가 필요
import ShareIcon from "../assets/share.svg";

const { width: screenWidth } = Dimensions.get("window");

type Place = {
  order: number; // 추가된 부분
  image: { uri: string };
  name: string;
  address: string;
  duration: string;
  cost: number; // 비용 추가
  type: string; // type 속성 추가
};

type DayPlan = {
  dayIndex: number; // 추가된 부분
  day: string;
  date: string;
  places: Place[];
};

type OptionModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onShare: () => void;
  onPlacePress: (place: Place) => void;
  onShareWithColleagues: () => void;
  images: any; // 추가된 부분
  themeName: any;
  description: any;
  keywords: any;
  dayPlans: any;
  onUpdate: (updatedSchedule: any) => void; // 추가된 부분
};

const OptionModal: React.FC<OptionModalProps> = ({
  isVisible,
  onClose,
  onShare,
  onPlacePress,
  onShareWithColleagues,
  onUpdate, // 추가된 부분
}) => {
  const [schedule, setSchedule] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchSchedule = async () => {
      const storedSchedule = await AsyncStorage.getItem("formattedSchedule");
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
    };
    fetchSchedule();
  }, []);

  if (!schedule) {
    return null;
  }

  const handleRemovePlace = async (dayIndex: number, placeOrder: number) => {
    const updatedDays = schedule.days.map((day: DayPlan) => {
      if (day.dayIndex === dayIndex) {
        const updatedPlaces = day.places
          .filter((place: Place) => place.order !== placeOrder)
          .map((place: Place, index: number) => ({
            ...place,
            order: index + 1, // order 값 업데이트
          }));
        return {
          ...day,
          places: updatedPlaces,
        };
      }
      return day;
    });

    const updatedTotalCost = updatedDays.reduce(
      (total: number, day: DayPlan) => {
        return (
          total +
          day.places.reduce(
            (dayTotal: number, place: Place) => dayTotal + place.cost,
            0
          )
        );
      },
      0
    );

    const updatedSchedule = {
      ...schedule,
      days: updatedDays,
      extraInfo: {
        ...schedule.extraInfo,
        totalCost: updatedTotalCost, // totalCost 업데이트
      },
    };
    setSchedule(updatedSchedule);
    onUpdate(updatedSchedule); // 추가된 부분

    // AsyncStorage에 업데이트된 일정 저장
    await AsyncStorage.setItem(
      "formattedSchedule",
      JSON.stringify(updatedSchedule)
    );
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        title: schedule.title,
        message: `${schedule.title}\n\n${schedule.startDate} - ${
          schedule.endDate
        }\n\n${schedule.summary}\n\n${schedule.days
          ?.map(
            (day) =>
              `${day.day} ${day.date}\n${day.places
                .map((place) => `- ${place.name} (${place.duration})`)
                .join("\n")}`
          )
          .join("\n\n")}`,
      };

      const result = await Share.share(shareContent);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // 공유 완료
          console.log("Shared with activity type:", result.activityType);
        } else {
          // 공유 완료
          console.log("Shared");
        }
      } else if (result.action === Share.dismissedAction) {
        // 공유 취소
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={{
        margin: 0,
        justifyContent: "flex-end",
        marginHorizontal: 0,
        marginVertical: 0,
        marginTop: 150,
      }}
    >
      <View style={styles.modalContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseIcon width={32} height={32} />
          </TouchableOpacity>
          <View style={styles.carouselContainer}>
            {schedule.images && schedule.images.length > 0 ? (
              <>
                <Carousel
                  data={schedule.images.slice(0, 2)}
                  renderItem={({ item }: { item: { uri: string } }) => (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.carouselImage}
                    />
                  )}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth}
                  containerCustomStyle={styles.carouselContainer}
                  onSnapToItem={(index) => setActiveSlide(index)}
                  autoplay={true}
                  autoplayDelay={5000}
                />
                <Pagination
                  dotsLength={Math.min(schedule.images.length, 2)}
                  activeDotIndex={activeSlide}
                  containerStyle={styles.carouselIndicatorContainer}
                  dotStyle={styles.activeDot}
                  inactiveDotStyle={styles.inactiveDot}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
              </>
            ) : (
              <>
                <Carousel
                  data={[
                    { uri: defaultTravelImage1 },
                    { uri: defaultTravelImage2 },
                  ]}
                  renderItem={({ item }) => (
                    <Image source={item.uri} style={styles.carouselImage} />
                  )}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth}
                  containerCustomStyle={styles.carouselContainer}
                  onSnapToItem={(index) => setActiveSlide(index)}
                  autoplay={true}
                  autoplayDelay={5000}
                />
                <Pagination
                  dotsLength={2}
                  activeDotIndex={activeSlide}
                  containerStyle={styles.carouselIndicatorContainer}
                  dotStyle={styles.activeDot}
                  inactiveDotStyle={styles.inactiveDot}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
              </>
            )}
          </View>
          <View style={styles.companionContainerLeft}>
            <Text style={styles.companion}>{schedule.companion}</Text>
          </View>
        </View>
        <ScrollView style={[styles.scrollableContent]}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <Text style={styles.scheduleDate}>
            {schedule.startDate} - {schedule.endDate}
          </Text>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>정보</Text>
            <Text style={styles.summary}>{schedule.summary}</Text>
          </View>
          <View style={styles.keywordSection}>
            <Text style={styles.sectionTitle}>키워드</Text>
            <View style={styles.keywordsContainer}>
              {schedule.keywords.map((keyword: string, index: number) => (
                <View key={index} style={styles.keywordBubble}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.dayPlansContainer}>
            {schedule.days.map((dayPlan: DayPlan, index: number) => (
              <View key={index} style={styles.dayPlanContainer}>
                <Text style={styles.dayPlanTitle}>
                  <Text style={styles.boldText}>{dayPlan.day}</Text>{" "}
                  {dayPlan.date}
                </Text>
                <Carousel
                  data={dayPlan.places}
                  renderItem={({ item }) => (
                    <View style={styles.placeCard}>
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName}>{item.title}</Text>
                        <Text style={styles.placeAddress}>{item.address}</Text>
                        <Text style={styles.placeDuration}>
                          {item.duration}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() =>
                          handleRemovePlace(dayPlan.dayIndex, item.order)
                        }
                      >
                        <Text style={styles.removeButtonText}>-</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  sliderWidth={screenWidth}
                  itemWidth={screenWidth * 0.72}
                  containerCustomStyle={styles.carouselContainer}
                  contentContainerCustomStyle={{
                    paddingLeft: 0,
                    paddingRight: screenWidth * 0.1,
                  }}
                />
              </View>
            ))}
          </View>
          {schedule.extraInfo && (
            <View style={styles.extraInfoSection}>
              <Text style={styles.sectionTitle}>추가 정보</Text>
              {schedule.extraInfo.estimatedCost?.map(
                (cost: { type: string; amount: number }, index: number) => (
                  <Text key={index} style={styles.extraInfoText}>
                    {cost.type}: {cost.amount.toLocaleString()}원
                  </Text>
                )
              )}
              {schedule.extraInfo.totalCost && (
                <Text style={styles.extraInfoText}>
                  총 비용: {schedule.extraInfo.totalCost.toLocaleString()}원
                </Text>
              )}
            </View>
          )}
        </ScrollView>
        <View style={styles.footerContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                onClose();
                // 일정 확정 메시지 전달
                onUpdate({
                  ...schedule,
                  status: "confirmed",
                });
              }}
            >
              <Text style={styles.confirmButtonText}>일정이 마음에 들어요</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <ShareIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    justifyContent: "flex-start",
    alignItems: "center",
    borderColor: "rgba(0, 0, 0, 0.1)",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    width: 24,
    height: 24,
  },
  carouselImage: {
    width: screenWidth,
    height: 180,
    resizeMode: "cover",
  },
  carouselContainer: {
    height: 180,
    width: screenWidth,
  },
  carouselIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    zIndex: 1,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "blue",
  },
  inactiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "lightgray",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 10,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  summary: {
    fontSize: 14,
    color: "#666",
    marginVertical: 10,
    alignSelf: "flex-start",
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    // borderWidth: 1,
    alignSelf: "flex-start",
  },
  keywordBubble: {
    backgroundColor: "#EAF2FF",
    padding: 13,
    borderRadius: 20,
    marginHorizontal: 4, // 키워드 간 좌우 간격 추가
    marginVertical: 4, // 키워드 간 상하 간격 추가
  },
  keywordText: {
    fontSize: 12,
    color: "#006CF7",
    fontWeight: "bold",
  },
  dayPlansContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 8,
    gap: 24,
  },
  dayPlanContainer: {
    // backgroundColor: "red",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: screenWidth * 0.9,
    height: 140,
  },
  dayPlanTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8, // 간격을 좁힘
  },
  boldText: {
    fontWeight: "bold",
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    // paddingLeft: 8,
    backgroundColor: "#F8F9FE",
    borderRadius: 16,
    minWidth: 280,
    minHeight: 101,
    flex: 1,
  },
  placeInfo: {
    flex: 1,
    padding: 16,
    paddingLeft: 16,
    gap: 8,
    width: 224,
    height: 101,
  },
  placeName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
    color: "#1F2024",
  },
  placeAddress: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0.01,
    color: "#71727A",
  },
  placeDuration: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    color: "#006FFD",
  },
  removeButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFE7E7",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 20,
    color: "#FF0000",
    lineHeight: 20,
  },
  scrollableContent: {
    flex: 1,
    width: "100%",
    padding: 24,
    paddingTop: 16,
  },
  headerContainer: {
    width: "100%",
    backgroundColor: "white",
    height: 180,
    position: "relative",
  },
  companionContainerLeft: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 10,
  },
  companionContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 10,
  },
  companion: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  footerContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingBottom: 32,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 8,
  },
  keywordSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
    color: "#333",
  },
  extraInfoSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#F6F6F6",
    padding: 16,
    borderRadius: 8,
  },
  extraInfoText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#71727A",
    marginTop: 8,
  },
});

export default OptionModal;
