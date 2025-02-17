import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Pagination from "react-native-snap-carousel/src/pagination/Pagination";
import CloseIcon from "../assets/close.svg";
import { wrap } from "module";

const { width: screenWidth } = Dimensions.get("window");

type Place = {
  image: { uri: string };
  name: string;
  address: string;
  duration: string;
};

type DayPlan = {
  day: string;
  date: string;
  places: Place[];
};

type OptionModalProps = {
  isVisible: boolean;
  onClose: () => void;
  images: { uri: string }[];
  themeName: string;
  description: string;
  keywords: string[];
  dayPlans: DayPlan[];
  onShare: () => void;
  onPlacePress: (place: Place) => void;
  onShareWithColleagues: () => void;
};

const OptionModal: React.FC<OptionModalProps> = ({
  isVisible,
  onClose,
  images,
  themeName,
  description,
  keywords,
  dayPlans,
  onShare,
  onPlacePress,
  onShareWithColleagues,
}) => {
  const [activeSlide, setActiveSlide] = React.useState(0);

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
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CloseIcon width={32} height={32} />
        </TouchableOpacity>
        <View style={styles.headerContainer}>
          <View style={styles.carouselContainer}>
            <Carousel
              data={images}
              renderItem={({ item }) => (
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
              dotsLength={images.length}
              activeDotIndex={activeSlide}
              containerStyle={styles.carouselIndicatorContainer}
              dotStyle={styles.activeDot}
              inactiveDotStyle={styles.inactiveDot}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
          </View>
        </View>
        <ScrollView style={[styles.scrollableContent]}>
          <Text style={styles.scheduleTitle}>{themeName}</Text>
          <Text style={styles.scheduleDate}>2024.02.12 - 2024.02.15</Text>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>정보</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <View style={styles.keywordSection}>
            <Text style={styles.sectionTitle}>키워드</Text>
            <View style={styles.keywordsContainer}>
              {keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordBubble}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.dayPlansContainer}>
            {dayPlans.map((dayPlan, index) => (
              <View key={index} style={styles.dayPlanContainer}>
                <Text style={styles.dayPlanTitle}>
                  <Text style={styles.boldText}>{dayPlan.day}</Text>{" "}
                  {dayPlan.date}
                </Text>
                <Carousel
                  data={dayPlan.places}
                  renderItem={({ item }) => (
                    <View style={styles.placeCard}>
                      <Image source={item.image} style={styles.placeImage} />
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName}>{item.name}</Text>
                        <Text style={styles.placeAddress}>{item.address}</Text>
                        <Text style={styles.placeDuration}>
                          {item.duration}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onPlacePress(item)}
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
        </ScrollView>
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.shareWithColleaguesButton}
            onPress={onShareWithColleagues}
          >
            <Text style={styles.shareWithColleaguesButtonText}>
              동료에게 여행 장소 공유하기
            </Text>
          </TouchableOpacity>
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
  description: {
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
    padding: 12,
    borderRadius: 16,
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
    paddingLeft: 16,
    backgroundColor: "#F8F9FE",
    borderRadius: 16,
    width: 280,
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 5,
  },
  placeInfo: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
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
    lineHeight: 12,
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
  footerContainer: {
    width: "100%",
    padding: 24,
    backgroundColor: "white",
  },
  shareWithColleaguesButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
  },
  shareWithColleaguesButtonText: {
    color: "white",
    fontSize: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
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
});

export default OptionModal;
