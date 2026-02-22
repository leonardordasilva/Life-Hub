import React, { useState, useMemo, useCallback } from 'react';
import { useVacation } from '../../hooks/useVacation';
import { useToast } from '../../components/Toast';
import { Plane, Building, Map, Plus, Trash2, Calendar, Clock, Ticket, Pencil, Check, DollarSign, MapPin, Luggage, Loader2, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { VacationFlight, VacationHotel, VacationTour, TourType, VacationTrip, FlightTripType } from '../../types';

interface VacationDashboardProps {}

export const VacationDashboard: React.FC<VacationDashboardProps> = () => {
  const { showToast } = useToast();
  const handleError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const { 
    trips, flights, hotels, tours, loading, 
    addTrip, editTrip, removeTrip,
    addFlight, editFlight, removeFlight, 
    addHotel, editHotel, removeHotel, 
    addTour, editTour, removeTour 
  } = useVacation(handleError);

  // All users can fully manage their own data (RLS handles isolation)
  const isAdmin = true;

  // Navigation
  const [activeTab, setActiveTab] = useState<'FLIGHTS' | 'HOTELS' | 'TOURS'>('FLIGHTS');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Modals & Edits
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Year Filter State (Global)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Compute years that have any vacation data (trips, flights, hotels, tours)
  const yearsWithTrips = useMemo(() => {
    const years = new Set<number>();
    trips.forEach(t => years.add(t.year));
    flights.forEach(f => years.add(f.year));
    hotels.forEach(h => years.add(h.year));
    tours.forEach(t => years.add(t.year));
    return years;
  }, [trips, flights, hotels, tours]);

  // Generate a range of years to show (centered on selectedYear, plus all years with data)
  const visibleYears = useMemo(() => {
    const range = new Set<number>();
    for (let i = selectedYear - 2; i <= selectedYear + 2; i++) range.add(i);
    yearsWithTrips.forEach(y => range.add(y));
    return Array.from(range).sort((a, b) => a - b);
  }, [selectedYear, yearsWithTrips]);

  // Forms
  const [tripForm, setTripForm] = useState<Partial<VacationTrip>>({});
  const [flightForm, setFlightForm] = useState<Partial<VacationFlight>>({ tripType: 'ROUND_TRIP' });
  const [hotelForm, setHotelForm] = useState<Partial<VacationHotel>>({});
  const [tourForm, setTourForm] = useState<Partial<VacationTour>>({ type: 'HALF_DAY' });

  // Filter Data
  const currentTrips = useMemo(() => trips.filter(t => t.year === selectedYear), [trips, selectedYear]);
  
  // Only show items for the Selected Trip
  const currentFlights = useMemo(() => flights.filter(f => f.tripId === selectedTripId), [flights, selectedTripId]);
  const currentHotels = useMemo(() => hotels.filter(h => h.tripId === selectedTripId), [hotels, selectedTripId]);
  const currentTours = useMemo(() => tours.filter(t => t.tripId === selectedTripId), [tours, selectedTripId]);

  // Calculate Totals for Selected Trip
  const totalFlightsCost = currentFlights.reduce((acc, curr) => acc + curr.price, 0);
  const totalHotelsCost = currentHotels.reduce((acc, curr) => acc + curr.price, 0);
  const totalToursCost = currentTours.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const grandTotal = totalFlightsCost + totalHotelsCost + totalToursCost;

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      // Fix timezone offset issues by manually parsing YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
      if (!dateStr) return '';
      // Manually parse to avoid timezone shifts (display as is)
      try {
          const parts = dateStr.split('T');
          if (parts.length >= 2) {
              const [year, month, day] = parts[0].split('-');
              const time = parts[1].substring(0, 5); // HH:mm
              return `${day}/${month}/${year} ${time}`;
          }
      } catch (e) {
          console.error('Error formatting date:', e);
      }
      return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const calculateDuration = (start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.abs(e.getTime() - s.getTime());
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateDaysUntil = (startDate?: string) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Para garantir que a comparação seja feita apenas por dias, resetamos a hora de 'start' também
    const startDateNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const diff = startDateNormalized.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // --- ACTIONS ---

  const openAddTripModal = () => {
      setEditingTripId(null);
      setTripForm({ year: selectedYear });
      setShowTripModal(true);
  };

  const startEditTrip = (trip: VacationTrip) => {
    setEditingTripId(trip.id);
    setTripForm(trip);
    setShowTripModal(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
      e.preventDefault();
      if (tripForm.destination) {
          setSubmitting(true);
          try {
              if (editingTripId) {
                 await editTrip({
                     id: editingTripId,
                     destination: tripForm.destination,
                     startDate: tripForm.startDate,
                     endDate: tripForm.endDate,
                     year: tripForm.year || selectedYear,
                     coverUrl: tripForm.coverUrl
                 });
               } else {
                  const tripYear = tripForm.startDate ? new Date(tripForm.startDate).getFullYear() : selectedYear;
                  await addTrip({
                      destination: tripForm.destination,
                      startDate: tripForm.startDate,
                      endDate: tripForm.endDate,
                      year: tripYear
                  });
              }
              setShowTripModal(false);
              setEditingTripId(null);
          } finally {
              setSubmitting(false);
          }
      }
  };

  const openAddItemModal = () => {
    setEditingId(null);
    setFlightForm({ tripType: 'ROUND_TRIP' });
    setHotelForm({});
    setTourForm({ type: 'HALF_DAY' });
    setShowItemModal(true);
  };

  const startEditFlight = (f: VacationFlight) => {
    setEditingId(f.id);
    const formatForInput = (iso: string) => iso ? iso.slice(0, 16) : '';
    setFlightForm({
      ...f,
      departureTime: formatForInput(f.departureTime),
      arrivalTime: formatForInput(f.arrivalTime),
      returnDepartureTime: formatForInput(f.returnDepartureTime || ''),
      returnArrivalTime: formatForInput(f.returnArrivalTime || '')
    });
    setShowItemModal(true);
  };

  const startEditHotel = (h: VacationHotel) => {
    setEditingId(h.id);
    setHotelForm(h);
    setShowItemModal(true);
  };

  const startEditTour = (t: VacationTour) => {
    setEditingId(t.id);
    setTourForm(t);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTripId) return;

    setSubmitting(true);
    try {
        // Use current year
        const yearToSave = selectedYear;

        if (activeTab === 'FLIGHTS') {
          const flightData = {
            tripId: selectedTripId,
            departure: flightForm.departure!,
            destination: flightForm.destination!,
            departureTime: flightForm.departureTime!,
            arrivalTime: flightForm.arrivalTime!,
            duration: flightForm.duration || '',
            airline: flightForm.airline!,
            pnr: flightForm.pnr || '',
            price: Number(flightForm.price),
            year: yearToSave,
            tripType: flightForm.tripType || 'ROUND_TRIP',
            returnDepartureTime: (flightForm.tripType || 'ROUND_TRIP') === 'ROUND_TRIP' ? (flightForm.returnDepartureTime || undefined) : undefined,
            returnArrivalTime: (flightForm.tripType || 'ROUND_TRIP') === 'ROUND_TRIP' ? (flightForm.returnArrivalTime || undefined) : undefined,
            returnDuration: (flightForm.tripType || 'ROUND_TRIP') === 'ROUND_TRIP' ? (flightForm.returnDuration || undefined) : undefined
          };

          if (editingId) {
            await editFlight({ ...flightData, id: editingId });
          } else {
            await addFlight(flightData);
          }

        } else if (activeTab === 'HOTELS') {
          const hotelData = {
            tripId: selectedTripId,
            name: hotelForm.name!,
            checkIn: hotelForm.checkIn!,
            checkOut: hotelForm.checkOut!,
            price: Number(hotelForm.price),
            year: yearToSave
          };

          if (editingId) {
            await editHotel({ ...hotelData, id: editingId });
          } else {
            await addHotel(hotelData);
          }

        } else if (activeTab === 'TOURS') {
          const tourData = {
            tripId: selectedTripId,
            name: tourForm.name!,
            company: tourForm.company!,
            date: tourForm.date!,
            time: tourForm.time!,
            type: tourForm.type as TourType,
            price: Number(tourForm.price || 0),
            year: yearToSave
          };

          if (editingId) {
            await editTour({ ...tourData, id: editingId });
          } else {
            await addTour(tourData);
          }
        }

        setShowItemModal(false);
        setEditingId(null);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Plane className="w-8 h-8 text-cyan-400" />
              Planejamento de Férias
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-400">Organizador de viagens: primeiro o destino, depois os detalhes.</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl">
                <button
                    onClick={() => { setSelectedYear(prev => prev - 1); setSelectedTripId(null); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1 overflow-x-auto custom-scrollbar px-1">
                    {visibleYears.map(year => {
                        const hasData = yearsWithTrips.has(year);
                        const isSelected = year === selectedYear;
                        return (
                            <button
                                key={year}
                                onClick={() => { setSelectedYear(year); setSelectedTripId(null); }}
                                className={`relative px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                    isSelected
                                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                                        : hasData
                                            ? 'bg-cyan-800/40 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-700/50'
                                            : 'text-slate-500 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {year}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => { setSelectedYear(prev => prev + 1); setSelectedTripId(null); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </header>

        {/* TRIP SELECTOR SECTION */}
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Destinos em {selectedYear}
                </h3>
                {isAdmin && (
                    <button
                        onClick={openAddTripModal}
                        className="btn btn-sm btn-cyan"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Destino
                    </button>
                )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                 {currentTrips.length === 0 && (
                     <div className="w-full text-center py-8 border border-dashed border-white/10 rounded-xl text-slate-500">
                         Nenhuma viagem planejada para {selectedYear}. {isAdmin ? 'Clique em "Novo Destino" para começar.' : ''}
                     </div>
                 )}
                 {currentTrips.map(trip => {
                    const daysUntil = calculateDaysUntil(trip.startDate);
                    const isSelected = selectedTripId === trip.id;
                    
                    return (
                        <button
                            key={trip.id}
                            onClick={() => setSelectedTripId(trip.id)}
                            className={`relative group min-w-[260px] p-5 rounded-xl border text-left transition-all ${
                                isSelected 
                                ? 'bg-cyan-900/30 border-cyan-500 ring-1 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                                : 'bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10'
                            }`}
                        >
                            <h4 className={`font-bold text-xl mb-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{trip.destination}</h4>
                            
                            <div className="flex flex-col gap-2 mt-2">
                                {trip.startDate && (
                                    <div className={`text-xs flex items-center gap-1.5 ${isSelected ? 'text-cyan-200' : 'text-slate-400'}`}>
                                        <Calendar className="w-3.5 h-3.5" /> 
                                        <span>
                                            {formatDate(trip.startDate)}
                                            {trip.endDate && ` - ${formatDate(trip.endDate)}`}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-4">
                                    {trip.startDate && trip.endDate && (
                                        <div className={`text-xs flex items-center gap-1.5 ${isSelected ? 'text-cyan-300/70' : 'text-slate-500'}`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{calculateDuration(trip.startDate, trip.endDate)} dias</span>
                                        </div>
                                    )}

                                    {/* COUNTDOWN BADGE */}
                                    {daysUntil !== null && daysUntil >= 0 && (
                                        <div className={`text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                                            daysUntil === 0 
                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-bold'
                                            : isSelected ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-slate-800 border-white/5 text-slate-300'
                                        }`}>
                                            {daysUntil === 0 ? <Plane className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                                            <span>{daysUntil === 0 ? 'Começa hoje!' : `Faltam ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dias'}`}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-4 h-4 text-cyan-400" />
                                </div>
                            )}
                            {isAdmin && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); startEditTrip(trip); }} 
                                        className="p-1.5 bg-black/60 hover:bg-cyan-500 rounded-lg text-white transition-colors"
                                        title="Editar Viagem"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </div>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); removeTrip(trip.id); }} 
                                        className="p-1.5 bg-black/60 hover:bg-red-500 rounded-lg text-white transition-colors"
                                        title="Excluir Viagem"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                 })}
            </div>
        </section>

        {/* DETAILS SECTION (Only if trip selected) */}
        {selectedTripId && selectedTrip ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Total Summary Card */}
                <div className="mb-8 bg-gradient-to-r from-cyan-900/20 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        {isAdmin && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-400">Total: {selectedTrip.destination}</h3>
                                <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(grandTotal)}</p>
                            </div>
                        )}
                        {!isAdmin && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-400">Destino</h3>
                                <p className="text-2xl font-bold text-white tracking-tight">{selectedTrip.destination}</p>
                            </div>
                        )}
                    </div>
                    
                    {isAdmin && (
                        <button
                            onClick={openAddItemModal}
                            className="btn btn-md btn-cyan"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar {activeTab === 'FLIGHTS' ? 'Passagem' : activeTab === 'HOTELS' ? 'Hospedagem' : 'Passeio'}
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('FLIGHTS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors font-medium border-b-2 whitespace-nowrap ${
                        activeTab === 'FLIGHTS' ? 'border-cyan-500 text-cyan-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Ticket className="w-4 h-4" /> Passagens
                    </button>
                    <button
                        onClick={() => setActiveTab('HOTELS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors font-medium border-b-2 whitespace-nowrap ${
                        activeTab === 'HOTELS' ? 'border-cyan-500 text-cyan-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Building className="w-4 h-4" /> Hospedagem
                    </button>
                    <button
                        onClick={() => setActiveTab('TOURS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors font-medium border-b-2 whitespace-nowrap ${
                        activeTab === 'TOURS' ? 'border-cyan-500 text-cyan-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Map className="w-4 h-4" /> Passeios
                    </button>
                </div>

                {/* Content Lists */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                ) : (
                <div className="grid gap-6">
                    
                    {/* FLIGHTS LIST */}
                    {activeTab === 'FLIGHTS' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-cyan-400" />
                                    Passagens Aéreas
                                </h3>
                                {isAdmin && (
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Passagens</span>
                                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalFlightsCost)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {currentFlights.map(f => (
                                    <div key={f.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:border-cyan-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-6 border-b border-dashed border-white/10 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">{f.airline}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                        f.tripType === 'ONE_WAY' 
                                                        ? 'border-amber-500/40 text-amber-400 bg-amber-900/20' 
                                                        : 'border-emerald-500/40 text-emerald-400 bg-emerald-900/20'
                                                    }`}>
                                                        {f.tripType === 'ONE_WAY' ? 'Somente Ida' : 'Ida e Volta'}
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-bold text-white mt-1">{f.departure.slice(0,3).toUpperCase()} <span className="text-cyan-500">✈</span> {f.destination.slice(0,3).toUpperCase()}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 block">PNR</span>
                                                <span className="font-mono text-cyan-300 font-bold">{f.pnr}</span>
                                            </div>
                                        </div>
                                        <div className="mb-1">
                                            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Plane className="w-3 h-3" /> Ida
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <div className="text-slate-500 text-xs">Partida</div>
                                                    <div className="text-white font-medium">{formatDateTime(f.departureTime)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-slate-500 text-xs">Duração</div>
                                                    <div className="text-slate-300">{f.duration}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-slate-500 text-xs">Chegada</div>
                                                    <div className="text-white font-medium">{formatDateTime(f.arrivalTime)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {f.tripType !== 'ONE_WAY' && (f.returnDepartureTime || f.returnArrivalTime || f.returnDuration) && (
                                            <div className="mt-4 pt-3 border-t border-dashed border-white/5">
                                                <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <Plane className="w-3 h-3 rotate-180" /> Volta
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <div className="text-slate-500 text-xs">Partida</div>
                                                        <div className="text-white font-medium">{formatDateTime(f.returnDepartureTime ?? '')}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-slate-500 text-xs">Duração</div>
                                                        <div className="text-slate-300">{f.returnDuration || '-'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-slate-500 text-xs">Chegada</div>
                                                        <div className="text-white font-medium">{formatDateTime(f.returnArrivalTime || '')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            {isAdmin ? (
                                                <span className="text-lg font-bold text-emerald-400">{formatCurrency(f.price)}</span>
                                            ) : (
                                                <span className="text-sm text-slate-500 italic">Preço oculto</span>
                                            )}
                                            {isAdmin && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => startEditFlight(f)} 
                                                        className="btn-icon btn-icon-edit"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => removeFlight(f.id)} 
                                                        className="btn-icon btn-icon-delete"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {currentFlights.length === 0 && <p className="text-slate-500 italic col-span-full text-center py-8">Nenhuma passagem cadastrada para {selectedTrip.destination}.</p>}
                            </div>
                        </div>
                    )}

                    {/* HOTELS LIST */}
                    {activeTab === 'HOTELS' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Building className="w-5 h-5 text-cyan-400" />
                                    Hospedagens
                                </h3>
                                {isAdmin && (
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Hospedagem</span>
                                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalHotelsCost)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentHotels.map(h => (
                                    <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group flex flex-col hover:border-cyan-500/30 transition-all">
                                        <div className="h-32 bg-gradient-to-br from-cyan-900/40 to-slate-900 flex items-center justify-center relative">
                                            <Building className="w-12 h-12 text-cyan-500/50" />
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-white mb-4">{h.name}</h3>
                                            <div className="space-y-3 text-sm text-slate-300 mb-6 flex-1">
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-slate-500">Check-in</span>
                                                    <span>{formatDate(h.checkIn)}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-slate-500">Check-out</span>
                                                    <span>{formatDate(h.checkOut)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                                                <div>
                                                    <span className="text-xs text-slate-500 block">Total</span>
                                                    {isAdmin ? (
                                                        <span className="text-lg font-bold text-emerald-400">{formatCurrency(h.price)}</span>
                                                    ) : (
                                                        <span className="text-sm text-slate-500 italic">Preço oculto</span>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => startEditHotel(h)} 
                                                            className="btn-icon btn-icon-edit"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeHotel(h.id)} 
                                                            className="btn-icon btn-icon-delete"
                                                            title="Remover"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {currentHotels.length === 0 && <p className="text-slate-500 italic col-span-full text-center py-8">Nenhuma hospedagem cadastrada para {selectedTrip.destination}.</p>}
                            </div>
                        </div>
                    )}

                    {/* TOURS LIST */}
                    {activeTab === 'TOURS' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Map className="w-5 h-5 text-cyan-400" />
                                    Passeios e Atividades
                                </h3>
                                {isAdmin && (
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Passeios</span>
                                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalToursCost)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                {currentTours.map(t => (
                                    <div key={t.id} className="flex flex-col md:flex-row items-center bg-white/5 border border-white/10 rounded-xl p-4 gap-4 hover:border-cyan-500/30 transition-all">
                                        <div className="bg-cyan-500/10 p-3 rounded-full text-cyan-400">
                                            <Map className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h4 className="font-bold text-white text-lg">{t.name}</h4>
                                            <p className="text-sm text-slate-400">{t.company}</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                                                <Calendar className="w-3 h-3 text-cyan-400" />
                                                {formatDate(t.date)}
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                                                <Clock className="w-3 h-3 text-cyan-400" />
                                                {t.time}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full font-medium text-xs border ${t.type === 'FULL_DAY' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/10' : 'border-blue-500/50 text-blue-400 bg-blue-900/10'}`}>
                                                {t.type === 'FULL_DAY' ? 'Dia Inteiro' : 'Meio Período'}
                                            </div>
                                            {isAdmin ? (
                                                <div className="flex items-center gap-1 font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-900/10 px-3 py-1 rounded-full">
                                                    {formatCurrency(t.price || 0)}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs italic">
                                                    Preço oculto
                                                </div>
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => startEditTour(t)} 
                                                    className="btn-icon btn-icon-edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => removeTour(t.id)} 
                                                    className="btn-icon btn-icon-delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {currentTours.length === 0 && <p className="text-slate-500 italic text-center py-8">Nenhum passeio cadastrado para {selectedTrip.destination}.</p>}
                            </div>
                        </div>
                    )}

                </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                 <Luggage className="w-16 h-16 text-slate-600 mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">Selecione um Destino</h3>
                 <p className="text-slate-400 max-w-md">
                     Clique em um dos destinos acima ou crie uma nova viagem para começar a adicionar passagens, hotéis e passeios.
                 </p>
            </div>
        )}

        {/* MODALS - Only render if Admin */}
        {isAdmin && showTripModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-cyan-500" /> {editingTripId ? 'Editar Destino' : 'Nova Viagem / Destino'}
                    </h3>
                    <form onSubmit={handleSaveTrip} className="space-y-4">
                        <div>
                            <label className="label-std">Destino (Cidade/País)</label>
                            <input required disabled={submitting} className="input-std disabled:opacity-50" placeholder="Ex: Orlando, FL" value={tripForm.destination || ''} onChange={e => setTripForm({...tripForm, destination: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="label-std">Início (Previsto)</label>
                                <input type="date" disabled={submitting} className="input-std disabled:opacity-50" value={tripForm.startDate || ''} onChange={e => setTripForm({...tripForm, startDate: e.target.value})} />
                             </div>
                             <div>
                                <label className="label-std">Fim (Previsto)</label>
                                <input type="date" disabled={submitting} className="input-std disabled:opacity-50" value={tripForm.endDate || ''} onChange={e => setTripForm({...tripForm, endDate: e.target.value})} />
                             </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button type="button" disabled={submitting} onClick={() => setShowTripModal(false)} className="btn btn-lg btn-ghost flex-1">Cancelar</button>
                            <button type="submit" disabled={submitting} className="btn btn-lg btn-cyan flex-1">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTripId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)} 
                                {submitting ? 'Salvando...' : (editingTripId ? 'Salvar Alterações' : 'Criar Destino')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {isAdmin && showItemModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  {editingId ? <Pencil className="w-6 h-6 text-cyan-500" /> : <Plus className="w-6 h-6 text-cyan-500" />}
                  {activeTab === 'FLIGHTS' && (editingId ? 'Editar Passagem' : 'Nova Passagem')}
                  {activeTab === 'HOTELS' && (editingId ? 'Editar Hospedagem' : 'Nova Hospedagem')}
                  {activeTab === 'TOURS' && (editingId ? 'Editar Passeio' : 'Novo Passeio')}
              </h3>
              
              <div className="mb-4 bg-white/5 p-3 rounded-lg text-sm text-cyan-200 border border-cyan-500/20">
                Adicionando para: <strong>{selectedTrip?.destination}</strong> ({selectedYear})
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                
                {activeTab === 'FLIGHTS' && (
                    <>
                        <div>
                            <label className="label-std">Tipo da Passagem</label>
                            <select disabled={submitting} className="input-std disabled:opacity-50" value={flightForm.tripType || 'ROUND_TRIP'} onChange={e => setFlightForm({...flightForm, tripType: e.target.value as FlightTripType})}>
                                <option value="ROUND_TRIP">Ida e Volta</option>
                                <option value="ONE_WAY">Somente Ida</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input required disabled={submitting} placeholder="Origem (Ex: SAO)" className="input-std disabled:opacity-50" value={flightForm.departure || ''} onChange={e => setFlightForm({...flightForm, departure: e.target.value})} />
                            <input required disabled={submitting} placeholder="Destino (Ex: MIA)" className="input-std disabled:opacity-50" value={flightForm.destination || ''} onChange={e => setFlightForm({...flightForm, destination: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <input required disabled={submitting} placeholder="Cia Aérea" className="input-std disabled:opacity-50" value={flightForm.airline || ''} onChange={e => setFlightForm({...flightForm, airline: e.target.value})} />
                             <input required disabled={submitting} placeholder="Localizador (PNR)" className="input-std disabled:opacity-50" value={flightForm.pnr || ''} onChange={e => setFlightForm({...flightForm, pnr: e.target.value})} />
                        </div>
                        <div className="mt-2 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                <Plane className="w-4 h-4" /> Voo de Ida
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="label-std">Partida</label>
                                    <input required disabled={submitting} type="datetime-local" className="input-std disabled:opacity-50" value={flightForm.departureTime || ''} onChange={e => setFlightForm({...flightForm, departureTime: e.target.value})} />
                                 </div>
                                 <div>
                                    <label className="label-std">Chegada</label>
                                    <input required disabled={submitting} type="datetime-local" className="input-std disabled:opacity-50" value={flightForm.arrivalTime || ''} onChange={e => setFlightForm({...flightForm, arrivalTime: e.target.value})} />
                                 </div>
                            </div>
                            <div className="mt-3">
                                <input required disabled={submitting} placeholder="Duração Ida (Ex: 8h 30m)" className="input-std disabled:opacity-50" value={flightForm.duration || ''} onChange={e => setFlightForm({...flightForm, duration: e.target.value})} />
                            </div>
                        </div>

                        {(flightForm.tripType || 'ROUND_TRIP') === 'ROUND_TRIP' && (
                            <div className="mt-2 pt-4 border-t border-white/10">
                                <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                                    <Plane className="w-4 h-4 rotate-180" /> Voo de Volta
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="label-std">Partida (Volta)</label>
                                        <input required disabled={submitting} type="datetime-local" className="input-std disabled:opacity-50" value={flightForm.returnDepartureTime || ''} onChange={e => setFlightForm({...flightForm, returnDepartureTime: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="label-std">Chegada (Volta)</label>
                                        <input required disabled={submitting} type="datetime-local" className="input-std disabled:opacity-50" value={flightForm.returnArrivalTime || ''} onChange={e => setFlightForm({...flightForm, returnArrivalTime: e.target.value})} />
                                     </div>
                                </div>
                                <div className="mt-3">
                                    <input required disabled={submitting} placeholder="Duração Volta (Ex: 10h 15m)" className="input-std disabled:opacity-50" value={flightForm.returnDuration || ''} onChange={e => setFlightForm({...flightForm, returnDuration: e.target.value})} />
                                </div>
                            </div>
                        )}

                        <div className="mt-2 pt-4 border-t border-white/10">
                            <label className="label-std">Valor Total (R$)</label>
                            <input required disabled={submitting} type="number" step="0.01" placeholder="Valor Total (R$)" className="input-std disabled:opacity-50" value={flightForm.price || ''} onChange={e => setFlightForm({...flightForm, price: Number(e.target.value)})} />
                        </div>
                    </>
                )}

                {activeTab === 'HOTELS' && (
                    <>
                        <input required disabled={submitting} placeholder="Nome do Hotel" className="input-std disabled:opacity-50" value={hotelForm.name || ''} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="label-std">Check-in</label>
                                <input required disabled={submitting} type="date" className="input-std disabled:opacity-50" value={hotelForm.checkIn || ''} onChange={e => setHotelForm({...hotelForm, checkIn: e.target.value})} />
                             </div>
                             <div>
                                <label className="label-std">Check-out</label>
                                <input required disabled={submitting} type="date" className="input-std disabled:opacity-50" value={hotelForm.checkOut || ''} onChange={e => setHotelForm({...hotelForm, checkOut: e.target.value})} />
                             </div>
                        </div>
                        <input required disabled={submitting} type="number" step="0.01" placeholder="Valor Total (R$)" className="input-std disabled:opacity-50" value={hotelForm.price || ''} onChange={e => setHotelForm({...hotelForm, price: Number(e.target.value)})} />
                    </>
                )}

                {activeTab === 'TOURS' && (
                    <>
                        <input required disabled={submitting} placeholder="Nome do Passeio" className="input-std disabled:opacity-50" value={tourForm.name || ''} onChange={e => setTourForm({...tourForm, name: e.target.value})} />
                        <input required disabled={submitting} placeholder="Empresa Responsável" className="input-std disabled:opacity-50" value={tourForm.company || ''} onChange={e => setTourForm({...tourForm, company: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="label-std">Data</label>
                                <input required disabled={submitting} type="date" className="input-std disabled:opacity-50" value={tourForm.date || ''} onChange={e => setTourForm({...tourForm, date: e.target.value})} />
                             </div>
                             <div>
                                <label className="label-std">Horário Saída</label>
                                <input required disabled={submitting} type="time" className="input-std disabled:opacity-50" value={tourForm.time || ''} onChange={e => setTourForm({...tourForm, time: e.target.value})} />
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="label-std">Tipo</label>
                                <select disabled={submitting} className="input-std disabled:opacity-50" value={tourForm.type} onChange={e => setTourForm({...tourForm, type: e.target.value as TourType})}>
                                    <option value="HALF_DAY">Meio Período</option>
                                    <option value="FULL_DAY">Dia Inteiro</option>
                                </select>
                             </div>
                             <div>
                                <label className="label-std">Valor (R$)</label>
                                <input required disabled={submitting} type="number" step="0.01" className="input-std disabled:opacity-50" value={tourForm.price || ''} onChange={e => setTourForm({...tourForm, price: Number(e.target.value)})} />
                             </div>
                        </div>
                    </>
                )}

                <div className="flex gap-4 mt-6">
                  <button type="button" disabled={submitting} onClick={() => setShowItemModal(false)} className="btn btn-lg btn-ghost flex-1">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn btn-lg btn-cyan flex-1">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                    {submitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Criar Item')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <style>{`
        .input-std {
            width: 100%;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 0.75rem;
            padding: 0.75rem 1rem;
            color: white;
            outline: none;
        }
        .input-std:focus {
            border-color: #06b6d4;
            ring: 2px solid #06b6d4;
        }
        .label-std {
            display: block;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
        }
        
        /* Ocultar spin buttons de inputs numéricos */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};