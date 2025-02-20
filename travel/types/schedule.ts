export type TravelInfo = {
  previousExperience?: string;
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  people?: number;
  companions?: "solo" | "family" | "friends" | "couple";
  guideNeeded?: boolean;
  budget?: number;
  travelStyle?: string[];
  transportationType?: string[];
  additionalRequests?: string;
};

export interface Schedule {
  id: string;
  destination: string;
  title: string;
  startDate: string;
  endDate: string;
  travelStyle: string[];
  activities: string[];
  budget: number;
  isAIRecommended: boolean;
  itinerary: {
    date: string;
    activities: {
      time: string;
      place: string;
      description: string;
      cost: number;
    }[];
  }[];
  totalBudget: number;
  guideService: boolean;
}

export type ScheduleDay = {
  date: string;
  activities: ScheduleActivity[];
};

export type ScheduleActivity = {
  time: string;
  place: string;
  description: string;
  cost?: number;
};

export type SearchResult = {
  id: string;
  name: string;
  type: "destination" | "activity";
  description: string;
  imageUrl?: string;
};
