export type Station = {
  id: string;
  name: string;
  nameHindi: string;
  suggestions?: string[];
};

export type Stop = {
  stationId: string;
  arrivalTime?: string;
  departureTime?: string;
};

export type Route = {
  id: string;
  name: string;
  fromStation: string;
  toStation: string;
  stops: Stop[];
  totalDistance: string;
  forwardTravelTime: string;
};

export type Trip = {
  id: string;
  departure: string;
  arrival: string;
  direction: 'forward' | 'backward';
  delay: number;
};

export type BusAmenities = {
  ac: boolean;
  wifi: boolean;
  charging: boolean;
  sleeper: boolean;
  water: boolean;
};

export type Bus = {
  id: string;
  busName: string;
  busNumber: string;
  busCode: string;
  fare: string;
  availableSeats: number;
  totalSeats: number;
  crowd: 'कम' | 'मध्यम' | 'ज्यादा';
  routeId: string;
  fromStation: string;
  toStation: string;
  trips: Trip[];
  amenities?: BusAmenities;
};

export type NavigationState = {
  view: 'HOME' | 'RESULTS' | 'DETAIL' | 'BUSES' | 'FAVORITES' | 'ROUTES';
  params?: any;
  history: NavigationState[];
};
