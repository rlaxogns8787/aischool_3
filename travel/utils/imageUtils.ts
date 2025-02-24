// 한국 여행 이미지 배열
const koreaImages = [
  require("../assets/korea/photos1.jpg"),
  require("../assets/korea/photos2.jpg"),
  require("../assets/korea/photos3.jpg"),
  require("../assets/korea/photos4.jpg"),
  require("../assets/korea/photos5.jpg"),
  require("../assets/korea/photos6.jpg"),
  require("../assets/korea/photos7.jpg"),
  require("../assets/korea/photos8.jpg"),
  require("../assets/korea/photos9.jpg"),
  require("../assets/korea/photos10.jpg"),
  require("../assets/korea/photos11.jpg"),
  require("../assets/korea/photos12.jpg"),
  require("../assets/korea/photos13.jpg"),
  require("../assets/korea/photos14.jpg"),
  require("../assets/korea/photos15.jpg"),
  require("../assets/korea/photos16.jpg"),
];

// 랜덤 이미지 가져오기
export const getRandomKoreaImage = () => {
  const randomIndex = Math.floor(Math.random() * koreaImages.length);
  return koreaImages[randomIndex];
};

// 여러 개의 랜덤 이미지 가져오기
export const getMultipleRandomKoreaImages = (count: number) => {
  const shuffled = [...koreaImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
