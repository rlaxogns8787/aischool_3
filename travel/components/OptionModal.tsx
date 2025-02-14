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
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <View style={styles.carouselContainer}>
          <Carousel
            data={images}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={styles.carouselImage} />
            )}
            sliderWidth={screenWidth}
            itemWidth={screenWidth * 0.8}
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
        <View style={styles.header}>
          <Text style={styles.themeName}>{themeName}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.keywordsContainer}>
          {keywords.map((keyword, index) => (
            <View key={index} style={styles.keywordBubble}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
        <ScrollView style={styles.dayPlansContainer}>
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
                      <Text style={styles.placeDuration}>{item.duration}</Text>
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
        </ScrollView>
        <TouchableOpacity
          style={styles.shareWithColleaguesButton}
          onPress={onShareWithColleagues}
        >
          <Text style={styles.shareWithColleaguesButtonText}>
            동료에게 여행 장소 공유하기
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: "black",
  },
  carouselImage: {
    width: screenWidth * 0.8,
    height: 200,
    borderRadius: 10,
  },
  carouselContainer: {
    height: 250,
  },
  carouselIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
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
    padding: 8,
    borderRadius: 15,
    margin: 5,
  },
  keywordText: {
    fontSize: 12,
    color: "#006CF7",
    fontWeight: "bold",
  },
  dayPlansContainer: {
    maxHeight: 400,
    marginBottom: 10,
  },
  dayPlanContainer: {
    marginVertical: 5, // 간격을 좁힘
    borderWidth: 0,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: -150,
    marginLeft: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: screenWidth * 0.9,
  },
  dayPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5, // 간격을 좁힘
  },
  boldText: {
    fontWeight: "bold",
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    backgroundColor: "#E5FBFF",
    borderRadius: 5,
    marginVertical: 10,
    borderWidth: 0.5,
    borderColor: "#B4F0FC",
    width: screenWidth * 0.66,
  },
  placeImage: {
    width: 80,
    height: 60,
    borderRadius: 5,
  },
  placeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  placeAddress: {
    fontSize: 12,
    color: "#666",
  },
  placeDuration: {
    fontSize: 12,
    color: "#666",
  },
  removeButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 30, // 원의 지름
    height: 30, // 원의 지름
    borderRadius: 15, // 원의 반지름
    backgroundColor: "#FACECB",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 40, // 텍스트 크기

    color: "red",
    lineHeight: 36, // 텍스트 높이
  },
  shareWithColleaguesButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  shareWithColleaguesButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default OptionModal;
