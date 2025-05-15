import type { Timestamp } from 'firebase/firestore';

export interface Webinar {
  id: string;
  title: string;
  hostId: string;
  createdAt: Timestamp;
  status: 'scheduled' | 'active' | 'ended';
  summary?: string;
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant';
  joinedAt: Timestamp;
  isMuted: boolean;
  isVideoOff: boolean;
  handRaised: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Timestamp;
}
