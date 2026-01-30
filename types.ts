export enum UserTrack {
  STUDENT = 'Student',
  YOUNG_ADULT = 'Young Adult'
}

export interface UserStats {
  savings: number;
  happiness: number;
  knowledge: number;
}

export interface GameScenario {
  id: string;
  situation: string;
  options: {
    text: string;
    impact: Partial<UserStats>;
    feedback: string;
  }[];
  theme: 'Savings' | 'Budgeting' | 'Scam' | 'Investment' | 'Digital';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
