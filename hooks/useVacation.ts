import { useState, useEffect } from 'react';
import { VacationFlight, VacationHotel, VacationTour, VacationTrip, UserRole } from '../types';
import { supabase } from '../src/integrations/supabase/client';

export const useVacation = (role?: UserRole, onError?: (msg: string) => void) => {
  const [trips, setTrips] = useState<VacationTrip[]>([]);
  const [flights, setFlights] = useState<VacationFlight[]>([]);
  const [hotels, setHotels] = useState<VacationHotel[]>([]);
  const [tours, setTours] = useState<VacationTour[]>([]);
  const [loading, setLoading] = useState(true);

  const reportError = (msg: string) => { if (onError) onError(msg); };

  const fetchData = async () => {
    setLoading(true);

    if (role === 'VISITOR') {
        setTrips([]);
        setFlights([]);
        setHotels([]);
        setTours([]);
        setLoading(false);
        return;
    }

    try {
      const [tripsRes, flightsRes, hotelsRes, toursRes] = await Promise.all([
        supabase.from('vacation_trips').select('*').order('start_date', { ascending: true }),
        supabase.from('vacation_flights').select('*').order('departure_time', { ascending: true }),
        supabase.from('vacation_hotels').select('*').order('check_in', { ascending: true }),
        supabase.from('vacation_tours').select('*').order('date', { ascending: true })
      ]);

      if (tripsRes.error) throw tripsRes.error;
      if (flightsRes.error) throw flightsRes.error;
      if (hotelsRes.error) throw hotelsRes.error;
      if (toursRes.error) throw toursRes.error;

      if (tripsRes.data) {
        setTrips(tripsRes.data.map((t: any) => ({
            id: t.id,
            destination: t.destination,
            startDate: t.start_date,
            endDate: t.end_date,
            year: t.year || 2025,
            coverUrl: t.cover_url
        })));
      }

      if (flightsRes.data) {
        setFlights(flightsRes.data.map((f: any) => ({
          id: f.id,
          tripId: f.trip_id,
          departure: f.departure,
          destination: f.destination,
          departureTime: f.departure_time,
          arrivalTime: f.arrival_time,
          duration: f.duration,
          airline: f.airline,
          pnr: f.pnr,
          price: f.price,
          year: f.year || 2025,
          tripType: f.trip_type || 'ROUND_TRIP',
          returnDepartureTime: f.return_departure_time || '',
          returnArrivalTime: f.return_arrival_time || '',
          returnDuration: f.return_duration || ''
        })));
      }

      if (hotelsRes.data) {
        setHotels(hotelsRes.data.map((h: any) => ({
          id: h.id,
          tripId: h.trip_id,
          name: h.name,
          checkIn: h.check_in,
          checkOut: h.check_out,
          price: h.price,
          year: h.year || 2025
        })));
      }

      if (toursRes.data) {
        setTours(toursRes.data.map((t: any) => ({
          id: t.id,
          tripId: t.trip_id,
          name: t.name,
          company: t.company,
          date: t.date,
          time: t.time,
          type: t.type,
          price: t.price || 0,
          year: t.year || 2025
        })));
      }

    } catch (error) {
      console.error('Error fetching vacation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const addTrip = async (trip: Omit<VacationTrip, 'id'>) => {
      if (role === 'VISITOR') return;
      const tempId = crypto.randomUUID();
      setTrips(prev => [...prev, { ...trip, id: tempId }]);
      const { data, error } = await supabase.from('vacation_trips').insert({
          destination: trip.destination,
          start_date: trip.startDate,
          end_date: trip.endDate,
          year: trip.year,
          cover_url: trip.coverUrl
      }).select().single();
      if (error) {
          setTrips(prev => prev.filter(t => t.id !== tempId));
          reportError('Erro ao adicionar viagem');
      } else if (data) {
          setTrips(prev => prev.map(t => t.id === tempId ? {
            id: data.id, destination: data.destination, startDate: data.start_date,
            endDate: data.end_date, year: data.year, coverUrl: data.cover_url
          } : t));
      }
  };

  const editTrip = async (trip: VacationTrip) => {
      if (role === 'VISITOR') return;
      setTrips(prev => prev.map(t => t.id === trip.id ? trip : t));
      await supabase.from('vacation_trips').update({
          destination: trip.destination,
          start_date: trip.startDate,
          end_date: trip.endDate,
          year: trip.year,
          cover_url: trip.coverUrl
      }).eq('id', trip.id);
  };
  
  const removeTrip = async (id: string) => {
      if (role === 'VISITOR') return;
      setTrips(prev => prev.filter(t => t.id !== id));
      await supabase.from('vacation_trips').delete().eq('id', id);
  };

  const addFlight = async (flight: Omit<VacationFlight, 'id'>) => {
    if (role === 'VISITOR') return;
    const tempId = crypto.randomUUID();
    setFlights(prev => [...prev, { ...flight, id: tempId }].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()));
    const { data, error } = await supabase.from('vacation_flights').insert({
      trip_id: flight.tripId,
      departure: flight.departure,
      destination: flight.destination,
      departure_time: flight.departureTime,
      arrival_time: flight.arrivalTime,
      duration: flight.duration,
      airline: flight.airline,
      pnr: flight.pnr,
      price: flight.price,
      year: flight.year,
      trip_type: flight.tripType || 'ROUND_TRIP',
      return_departure_time: flight.returnDepartureTime ? flight.returnDepartureTime : null,
      return_arrival_time: flight.returnArrivalTime ? flight.returnArrivalTime : null,
      return_duration: flight.returnDuration ? flight.returnDuration : null
    }).select().single();
    if (error) {
      setFlights(prev => prev.filter(f => f.id !== tempId));
      reportError('Erro ao adicionar voo');
    } else if (data) {
      setFlights(prev => prev.map(f => f.id === tempId ? {
        id: data.id, tripId: data.trip_id, departure: data.departure, destination: data.destination,
        departureTime: data.departure_time, arrivalTime: data.arrival_time, duration: data.duration,
        airline: data.airline, pnr: data.pnr, price: data.price, year: data.year,
        tripType: data.trip_type || 'ROUND_TRIP', returnDepartureTime: data.return_departure_time || '',
        returnArrivalTime: data.return_arrival_time || '', returnDuration: data.return_duration || ''
      } : f));
    }
  };

  const editFlight = async (flight: VacationFlight) => {
    if (role === 'VISITOR') return;
    setFlights(prev => prev.map(f => f.id === flight.id ? flight : f).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()));
    await supabase.from('vacation_flights').update({
      trip_id: flight.tripId,
      departure: flight.departure,
      destination: flight.destination,
      departure_time: flight.departureTime,
      arrival_time: flight.arrivalTime,
      duration: flight.duration,
      airline: flight.airline,
      pnr: flight.pnr,
      price: flight.price,
      year: flight.year,
      trip_type: flight.tripType || 'ROUND_TRIP',
      return_departure_time: flight.returnDepartureTime ? flight.returnDepartureTime : null,
      return_arrival_time: flight.returnArrivalTime ? flight.returnArrivalTime : null,
      return_duration: flight.returnDuration ? flight.returnDuration : null
    }).eq('id', flight.id);
  };

  const removeFlight = async (id: string) => {
    if (role === 'VISITOR') return;
    setFlights(prev => prev.filter(f => f.id !== id));
    await supabase.from('vacation_flights').delete().eq('id', id);
  };

  const addHotel = async (hotel: Omit<VacationHotel, 'id'>) => {
    if (role === 'VISITOR') return;
    const tempId = crypto.randomUUID();
    setHotels(prev => [...prev, { ...hotel, id: tempId }].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()));
    const { data, error } = await supabase.from('vacation_hotels').insert({
      trip_id: hotel.tripId,
      name: hotel.name,
      check_in: hotel.checkIn,
      check_out: hotel.checkOut,
      price: hotel.price,
      year: hotel.year
    }).select().single();
    if (error) {
      setHotels(prev => prev.filter(h => h.id !== tempId));
      reportError('Erro ao adicionar hotel');
    } else if (data) {
      setHotels(prev => prev.map(h => h.id === tempId ? {
        id: data.id, tripId: data.trip_id, name: data.name,
        checkIn: data.check_in, checkOut: data.check_out, price: data.price, year: data.year
      } : h));
    }
  };

  const editHotel = async (hotel: VacationHotel) => {
    if (role === 'VISITOR') return;
    setHotels(prev => prev.map(h => h.id === hotel.id ? hotel : h).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()));
    await supabase.from('vacation_hotels').update({
      trip_id: hotel.tripId,
      name: hotel.name,
      check_in: hotel.checkIn,
      check_out: hotel.checkOut,
      price: hotel.price,
      year: hotel.year
    }).eq('id', hotel.id);
  };

  const removeHotel = async (id: string) => {
    if (role === 'VISITOR') return;
    setHotels(prev => prev.filter(h => h.id !== id));
    await supabase.from('vacation_hotels').delete().eq('id', id);
  };

  const addTour = async (tour: Omit<VacationTour, 'id'>) => {
    if (role === 'VISITOR') return;
    const tempId = crypto.randomUUID();
    setTours(prev => [...prev, { ...tour, id: tempId }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    const { data, error } = await supabase.from('vacation_tours').insert({
      trip_id: tour.tripId,
      name: tour.name,
      company: tour.company,
      date: tour.date,
      time: tour.time,
      type: tour.type,
      price: tour.price,
      year: tour.year
    }).select().single();
    if (error) {
      setTours(prev => prev.filter(t => t.id !== tempId));
      reportError('Erro ao adicionar passeio');
    } else if (data) {
      setTours(prev => prev.map(t => t.id === tempId ? {
        id: data.id, tripId: data.trip_id, name: data.name, company: data.company,
        date: data.date, time: data.time, type: data.type, price: data.price || 0, year: data.year
      } : t));
    }
  };

  const editTour = async (tour: VacationTour) => {
    if (role === 'VISITOR') return;
    setTours(prev => prev.map(t => t.id === tour.id ? tour : t).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    await supabase.from('vacation_tours').update({
      trip_id: tour.tripId,
      name: tour.name,
      company: tour.company,
      date: tour.date,
      time: tour.time,
      type: tour.type,
      price: tour.price,
      year: tour.year
    }).eq('id', tour.id);
  };

  const removeTour = async (id: string) => {
    if (role === 'VISITOR') return;
    setTours(prev => prev.filter(t => t.id !== id));
    await supabase.from('vacation_tours').delete().eq('id', id);
  };

  return { trips, flights, hotels, tours, loading, addTrip, editTrip, removeTrip, addFlight, editFlight, removeFlight, addHotel, editHotel, removeHotel, addTour, editTour, removeTour };
};