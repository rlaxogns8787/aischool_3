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

export type Schedule = {
  title: string;
  destination: string;
  activities: {
    day: number;
    items: {
      time: string;
      activity: string;
      location: string;
      description: string;
      cost: number;
      transportation: string;
    }[];
  }[];
  totalBudget: number;
  travelStyle: string;
  guideService: boolean;
};

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
