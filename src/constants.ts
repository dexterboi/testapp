import { Pitch, Amenity, User } from './types';

export const AMENITIES: Amenity[] = [
  { id: 'floodlights', name: 'Floodlights', icon: 'Zap' },
  { id: 'showers', name: 'Showers', icon: 'ShowerHead' },
  { id: 'parking', name: 'Parking', icon: 'Car' },
  { id: 'cafe', name: 'Cafe', icon: 'Coffee' },
  { id: 'wifi', name: 'WiFi', icon: 'Wifi' },
];

export const MOCK_PITCHES: Pitch[] = [
  {
    id: 'p1',
    name: 'Wembley Power League',
    location: { lat: 51.556, lng: -0.2795, address: 'Royal Route, Wembley' },
    pricePerHour: 80,
    surface: '4G',
    size: '5-a-side',
    rating: 4.8,
    reviewsCount: 124,
    image: 'https://picsum.photos/800/600?random=1',
    amenities: ['floodlights', 'parking', 'cafe', 'showers'],
  },
  {
    id: 'p2',
    name: 'Hackney Marshes Centre',
    location: { lat: 51.553, lng: -0.024, address: 'Homerton Rd, London' },
    pricePerHour: 45,
    surface: 'Grass',
    size: '11-a-side',
    rating: 4.2,
    reviewsCount: 89,
    image: 'https://picsum.photos/800/600?random=2',
    amenities: ['parking', 'showers'],
  },
  {
    id: 'p3',
    name: 'Shoreditch Ballerz',
    location: { lat: 51.523, lng: -0.075, address: 'High St, Shoreditch' },
    pricePerHour: 110,
    surface: 'Indoor',
    size: '5-a-side',
    rating: 4.9,
    reviewsCount: 210,
    image: 'https://picsum.photos/800/600?random=3',
    amenities: ['floodlights', 'cafe', 'wifi', 'showers'],
    isPeak: true,
  },
  {
    id: 'p4',
    name: 'Southbank City',
    location: { lat: 51.503, lng: -0.11, address: 'Belvedere Rd' },
    pricePerHour: 95,
    surface: '3G',
    size: '7-a-side',
    rating: 4.5,
    reviewsCount: 56,
    image: 'https://picsum.photos/800/600?random=4',
    amenities: ['floodlights', 'parking'],
  },
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Sterling',
  email: 'alex@example.com',
  loyaltyPoints: 7, // 7/10
  isAdmin: false,
};

export const ADD_ONS = [
  { id: 'ball', name: 'Pro Match Ball', price: 5 },
  { id: 'bibs', name: 'Set of 10 Bibs', price: 5 },
  { id: 'referee', name: 'FA Qualified Referee', price: 40 },
];