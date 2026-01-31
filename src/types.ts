export type SurfaceType = 'Grass' | '3G' | '4G' | 'Indoor' | 'Sand';

export interface Amenity {
  id: string;
  name: string;
  icon: string; // Lucide icon name
}

export interface User {
  id: string;
  username?: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'owner';
  loyaltyPoints: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export interface Complex {
  id: string;
  name: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
  owner: string; // User ID
}

export interface Pitch {
  id: string;
  complex: string | Complex; // ID or expanded
  name: string;
  pricePerHour: number;
  surface: SurfaceType;
  size: '5-a-side' | '7-a-side' | '11-a-side';
  image: string;
  rating?: number; // Optional if not in schema yet
  reviewsCount?: number;
}

export interface Booking {
  id: string;
  pitch: string | Pitch;
  user: string | User;
  date_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  accessCode?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Lobby {
  id: string;
  name: string;
  host_id: string;
  complex_id?: string;
  max_players: number;
  status: 'open' | 'full' | 'in_progress' | 'completed';
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  admin_id: string;
  avatar_url?: string;
  description?: string;
  created_at: string;
}