export interface Trip {
  id: string;
  tripNumber: number;
  origin: {
    lat: number;
    lng: number;
    address?: string;
  };
  destination: {
    lat: number;
    lng: number;
    address?: string;
  };
  startTime: string;
  endTime: string;
  mode: TravelMode;
  distance: number;
  purpose: TripPurpose;
  companions: number;
  frequency: TripFrequency;
  cost: number;
  createdAt: string;
}

export type TravelMode = 
  | 'walk'
  | 'bicycle'
  | 'motorcycle'
  | 'auto_rickshaw'
  | 'bus'
  | 'train'
  | 'metro'
  | 'car'
  | 'taxi'
  | 'other';

export type TripPurpose = 
  | 'work'
  | 'education'
  | 'shopping'
  | 'recreation'
  | 'medical'
  | 'social'
  | 'religious'
  | 'personal_business'
  | 'other';

export type TripFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'occasional'
  | 'first_time';

export const TRAVEL_MODES: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'walk', label: 'Walking', icon: '🚶' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw', icon: '🛺' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'train', label: 'Train', icon: '🚆' },
  { value: 'metro', label: 'Metro', icon: '🚇' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'taxi', label: 'Taxi/Cab', icon: '🚕' },
  { value: 'other', label: 'Other', icon: '🚐' },
];

export const TRIP_PURPOSES: { value: TripPurpose; label: string }[] = [
  { value: 'work', label: 'Work / Office' },
  { value: 'education', label: 'Education / School' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'recreation', label: 'Recreation / Leisure' },
  { value: 'medical', label: 'Medical / Healthcare' },
  { value: 'social', label: 'Social Visit' },
  { value: 'religious', label: 'Religious' },
  { value: 'personal_business', label: 'Personal Business' },
  { value: 'other', label: 'Other' },
];

export const TRIP_FREQUENCIES: { value: TripFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'occasional', label: 'Occasional' },
  { value: 'first_time', label: 'First Time' },
];