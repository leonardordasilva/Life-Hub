import React from 'react';

export enum AppSection {
  HOME = 'HOME',
  FINANCE = 'FINANCE',
  VACATION = 'VACATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  GAMES = 'GAMES',
  SETUP = 'SETUP'
}

export type UserRole = 'ADMIN' | 'VISITOR';

export interface SectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass: string;
}

// Finance Types
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface FinanceTransaction {
  id: string;
  categoryId: string;
  amount: number;
  month: number; // 0-11
  year: number;
  description?: string;
}

export interface AnnualReserve {
  year: number;
  initialAmount: number;
}

// Entertainment Types
export type MediaType = 'MOVIE' | 'SERIES' | 'GAME' | 'BOOK' | 'ANIME';
export type MediaStatus = 'PENDING' | 'WATCHING' | 'COMPLETED' | 'CASUAL';

export interface EntertainmentItem {
  id: string;
  title: string;
  type: MediaType;
  platform?: string; // Optional: Used generally or specifically
  status: MediaStatus;
  rating?: number;
  posterUrl?: string; // URL da imagem de capa/poster
  
  // New Metadata Fields
  synopsis?: string;
  genres?: string[];
  externalId?: string; // ID externo para sincronização precisa (TMDB ID ou OpenLibrary Key)

  // Specific Fields
  totalSeasons?: number;   // For Series
  watchedSeasons?: number; // For Series
  
  // New Granular Tracking for Series
  currentSeason?: number;
  currentSeasonTotalEpisodes?: number;
  currentSeasonWatchedEpisodes?: number;

  totalEpisodes?: number;  // For Anime
  watchedEpisodes?: number;// For Anime
  releaseDate?: string;    // For Movies and Books (ISO Date)
  author?: string;         // For Books
  isbn?: string;           // For Books (dedicated isbn column)
  finishedAt?: string;     // Date when item was marked COMPLETED
}

// Vacation Types
export type FlightTripType = 'ONE_WAY' | 'ROUND_TRIP';

export interface VacationTrip {
  id: string;
  destination: string;
  startDate?: string; // ISO Date
  endDate?: string;   // ISO Date
  year: number;
  coverUrl?: string;
}

export interface VacationFlight {
  id: string;
  tripId?: string; // Linked to a specific trip
  departure: string;
  destination: string;
  departureTime: string; // ISO Date string
  arrivalTime: string; // ISO Date string
  duration: string;
  airline: string;
  pnr: string; // Código Localizador
  price: number;
  year: number;
  tripType?: FlightTripType;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnDuration?: string;
}

export interface VacationHotel {
  id: string;
  tripId?: string; // Linked to a specific trip
  name: string;
  checkIn: string; // ISO Date string
  checkOut: string; // ISO Date string
  price: number;
  year: number;
}

export type TourType = 'FULL_DAY' | 'HALF_DAY';

export interface VacationTour {
  id: string;
  tripId?: string; // Linked to a specific trip
  name: string;
  company: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  time: string; // HH:mm
  type: TourType;
  price: number;
  year: number;
}