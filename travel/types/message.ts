export type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: { text: string; value: string }[];
  questions?: string[];
  searchResults?: any[];
  inputType?: "text" | "selection" | "date" | "number";
  expectedAnswer?: {
    type:
      | "previousExperience"
      | "destination"
      | "dates"
      | "people"
      | "companions"
      | "guideNeeded"
      | "budget"
      | "travelStyle"
      | "transportation"
      | "additionalRequests";
    options?: string[];
  };
};

export type Option = {
  text: string;
  value: string;
};
