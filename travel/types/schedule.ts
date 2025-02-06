export type Schedule = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  activities: string[];
  budget: number;
  isAIRecommended: boolean;
  itinerary: ScheduleDay[];
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
