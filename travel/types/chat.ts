export type MessageOption = {
  text: string;
  value: number;
  selected?: boolean;
};

export type StyleOption = {
  text: string;
  value: string;
  selected: boolean;
};

export type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  options?: MessageOption[];
  styleOptions?: StyleOption[];
  isLoading?: boolean;
};
