export interface WeatherDay {
  date: string;
  dayOfWeek: string;
  maxTemp: number;
  minTemp: number;
  condition: string; // e.g., "Sunny", "Rainy"
  description: string;
  icon: string; // Emoji or simple description for mapping
}

export interface OutfitGenerationResult {
  outfitImage: string | null;
  breakdownImage: string | null;
  description: string;
}

export interface LocationSearchResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string; // State/Province
  latitude: number;
  longitude: number;
  country_code?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  FETCHING_WEATHER = 'FETCHING_WEATHER',
  GENERATING_OUTFIT = 'GENERATING_OUTFIT',
}

export interface LocationState {
  city: string;
  lat?: number;
  lng?: number;
  useGps: boolean;
}

export type Gender = 'Female' | 'Male' | 'Unisex';