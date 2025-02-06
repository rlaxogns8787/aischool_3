export type SearchResult = {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviews: number;
};

export type Schedule = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  activities: {
    day: number;
    items: {
      time: string;
      activity: string;
      location: string;
      description: string;
      cost: number;
    }[];
  }[];
  totalBudget: number;
};
