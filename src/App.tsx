/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bus as BusIcon, 
  MapPin, 
  ArrowRight, 
  Search, 
  Heart, 
  Route as RouteIcon, 
  Home as HomeIcon, 
  Settings, 
  Moon, 
  Sun, 
  ChevronDown, 
  ArrowLeftRight, 
  Wifi, 
  Zap, 
  Wind, 
  Bed, 
  Droplets,
  ArrowLeft,
  Share2,
  Ticket,
  Users,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import { Station, Route, Bus, Trip, NavigationState } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [stations, setStations] = useState<Record<string, Station>>({});
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [buses, setBuses] = useState<Record<string, Bus>>({});
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
  
  const [nav, setNav] = useState<NavigationState>({
    view: 'HOME',
    history: []
  });

  const [searchParams, setSearchParams] = useState({
    from: 'barmer_stand',
    to: 'chouhtan_stand'
  });

  const [picker, setPicker] = useState<{ show: boolean; mode: 'from' | 'to' }>({ show: false, mode: 'from' });
  const [searchTerm, setSearchTerm] = useState('');

  // Firebase Data Loading
  useEffect(() => {
    const stationsRef = ref(db, 'stations');
    const routesRef = ref(db, 'routes');
    const busesRef = ref(db, 'buses');

    const unsubscribeStations = onValue(stationsRef, (snapshot) => {
      setStations(snapshot.val() || {});
    });
    const unsubscribeRoutes = onValue(routesRef, (snapshot) => {
      setRoutes(snapshot.val() || {});
    });
    const unsubscribeBuses = onValue(busesRef, (snapshot) => {
      setBuses(snapshot.val() || {});
      setLoading(false);
    });

    return () => {
      unsubscribeStations();
      unsubscribeRoutes();
      unsubscribeBuses();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Navigation Helpers
  const navigate = (view: NavigationState['view'], params?: any) => {
    setNav(prev => ({
      view,
      params,
      history: [...prev.history, { view: prev.view, params: prev.params, history: [] }]
    }));
  };

  const goBack = () => {
    setNav(prev => {
      if (prev.history.length === 0) return { ...prev, view: 'HOME' };
      const last = prev.history[prev.history.length - 1];
      return {
        view: last.view,
        params: last.params,
        history: prev.history.slice(0, -1)
      };
    });
  };

  const getStationName = (id: string) => {
    return stations[id]?.nameHindi || stations[id]?.name || id;
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const dep = parseTime(trip.departure) + (trip.delay || 0);
    const arr = parseTime(trip.arrival) + (trip.delay || 0);
    
    if (current < dep) return { status: 'upcoming', text: 'आने वाली', color: 'text-[var(--primary)] bg-orange-500/10' };
    if (current > arr) return { status: 'departed', text: 'समाप्त', color: 'text-slate-500 bg-slate-500/10' };
    return { status: 'live', text: 'चल रही', color: 'text-green-500 bg-green-500/10' };
  };

  const getLiveProgress = (trip: Trip) => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const dep = parseTime(trip.departure) + (trip.delay || 0);
    const arr = parseTime(trip.arrival) + (trip.delay || 0);
    if (current < dep) return 0;
    if (current > arr) return 100;
    return Math.min(100, Math.max(0, ((current - dep) / (arr - dep)) * 100));
  };

  // Components
  const AmenityIcon = ({ type, active }: { type: keyof Bus['amenities']; active?: boolean }) => {
    const icons = {
      ac: <Wind size={14} />,
      wifi: <Wifi size={14} />,
      charging: <Zap size={14} />,
      sleeper: <Bed size={14} />,
      water: <Droplets size={14} />
    };
    const labels = {
      ac: 'AC',
      wifi: 'WiFi',
      charging: 'Charging',
      sleeper: 'Sleeper',
      water: 'Water'
    };
    
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold",
        active ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "bg-slate-500/5 text-slate-400 border border-slate-500/10 opacity-50"
      )}>
        {icons[type]}
        <span>{labels[type]}</span>
      </div>
    );
  };

  const BusCard = ({ id, bus }: { id: string; bus: Bus }) => {
    const status = bus.trips?.[0] ? getTripStatus(bus.trips[0]) : null;
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 mb-3 cursor-pointer hover:border-[var(--primary)] transition-colors"
        onClick={() => navigate('DETAIL', { busId: id })}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3">
            <div className="bg-orange-500/10 border border-orange-500/20 text-[var(--primary)] text-[10px] font-black px-2 py-1 rounded-lg h-fit">
              {bus.busCode || 'PVT'}
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">{bus.busName}</h4>
              <p className="text-[10px] text-[var(--text-muted)]">{bus.busNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-[var(--primary)]">₹{bus.fare}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(id); }}
              className="text-red-500"
            >
              <Heart size={18} fill={favorites.includes(id) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="bg-[var(--surface2)] rounded-xl p-3 flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="font-bold text-xs">{getStationName(bus.fromStation).split(' ')[0]}</p>
            <p className="text-[9px] text-[var(--text-muted)] truncate">{getStationName(bus.fromStation)}</p>
          </div>
          <ArrowRight size={14} className="text-[var(--primary)] mx-2" />
          <div className="text-center flex-1">
            <p className="font-bold text-xs">{getStationName(bus.toStation).split(' ')[0]}</p>
            <p className="text-[9px] text-[var(--text-muted)] truncate">{getStationName(bus.toStation)}</p>
          </div>
        </div>

        {/* Amenities Row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <AmenityIcon type="ac" active={bus.amenities?.ac} />
          <AmenityIcon type="sleeper" active={bus.amenities?.sleeper} />
          <AmenityIcon type="wifi" active={bus.amenities?.wifi} />
          <AmenityIcon type="charging" active={bus.amenities?.charging} />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-[var(--primary)]" />
            <span>{bus.crowd} भीड़</span>
          </div>
          <div className="flex items-center gap-1">
            <Bed size={12} className="text-[var(--primary)]" />
            <span>{bus.availableSeats}/{bus.totalSeats} सीटें</span>
          </div>
          {status && (
            <div className={cn("ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold", status.color)}>
              {status.text}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const filteredBuses = useMemo(() => {
    if (nav.view === 'RESULTS') {
      const { from, to } = nav.params;
      return Object.entries(buses).filter(([_, bus]) => {
        const route = routes[bus.routeId];
        if (!route) return false;
        const stops = route.stops.map(s => s.stationId);
        const fromIdx = stops.indexOf(from);
        const toIdx = stops.indexOf(to);
        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
      });
    }
    if (nav.view === 'BUSES' && searchTerm) {
      const term = searchTerm.toLowerCase();
      return Object.entries(buses).filter(([_, bus]) => 
        bus.busName.toLowerCase().includes(term) || bus.busNumber.toLowerCase().includes(term)
      );
    }
    if (nav.view === 'FAVORITES') {
      return Object.entries(buses).filter(([id]) => favorites.includes(id));
    }
    return [];
  }, [nav, buses, routes, searchTerm, favorites]);

  return (
    <div className="max-w-[450px] mx-auto min-h-screen bg-[var(--background)] flex flex-col relative pb-20">
      
      {/* Header / Hero */}
      <AnimatePresence mode="wait">
        {nav.view === 'HOME' ? (
          <motion.div 
            key="home-hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-linear-to-br from-orange-50 to-[var(--background)] dark:from-orange-950/20 dark:to-[var(--background)] p-6 pt-12 rounded-b-[40px] mb-[-40px] relative z-0"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[var(--primary)] text-[10px] font-black uppercase tracking-wider">100% सटीक लाइव ट्रैकिंग</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
                  <Settings size={20} />
                </button>
              </div>
            </div>

            <button className="w-full btn-primary flex items-center justify-center gap-2 mb-6 py-4 shadow-orange-500/20 shadow-xl">
              <Download size={20} />
              <span>ऐप डाउनलोड करें</span>
            </button>

            <h1 className="text-5xl font-black text-[var(--primary)] tracking-tighter mb-2">Oh my bus</h1>
            <p className="text-2xl font-bold leading-tight">आपकी यात्रा, <span className="text-[var(--primary)]">हमारी जिम्मेदारी</span></p>
          </motion.div>
        ) : (
          <motion.div 
            key="sub-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 flex items-center gap-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-50"
          >
            <button onClick={goBack} className="p-2 text-[var(--primary)]">
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-bold text-lg">
              {nav.view === 'RESULTS' ? 'बसें खोजें' : 
               nav.view === 'DETAIL' ? 'बस विवरण' : 
               nav.view === 'BUSES' ? 'सभी बसें' : 
               nav.view === 'FAVORITES' ? 'पसंदीदा' : 'रूट'}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 px-5 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* HOME VIEW */}
          {nav.view === 'HOME' && (
            <motion.div 
              key="home-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pt-10"
            >
              <div className="card p-6 mb-6 shadow-xl shadow-black/5">
                <div className="flex items-center gap-2 mb-4">
                  <RouteIcon size={18} className="text-[var(--primary)]" />
                  <h3 className="font-bold text-sm">रूट खोजें</h3>
                </div>

                <div 
                  className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-2 cursor-pointer"
                  onClick={() => setPicker({ show: true, mode: 'from' })}
                >
                  <div className="w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-orange-500/30" />
                  <span className="text-sm font-medium">{getStationName(searchParams.from)}</span>
                </div>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <button 
                    onClick={() => setSearchParams(p => ({ from: p.to, to: p.from }))}
                    className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[var(--primary)]"
                  >
                    <ArrowLeftRight size={18} />
                  </button>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <div 
                  className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-4 cursor-pointer"
                  onClick={() => setPicker({ show: true, mode: 'to' })}
                >
                  <div className="w-3 h-3 rounded-sm bg-[var(--text-muted)]" />
                  <span className="text-sm font-medium">{getStationName(searchParams.to)}</span>
                </div>

                <button 
                  onClick={() => navigate('RESULTS', searchParams)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  <span>बसें खोजें</span>
                </button>
              </div>

              <section className="mb-6">
                <h4 className="font-bold text-sm mb-3">लोकप्रिय मार्ग</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { from: 'barmer_stand', to: 'chouhtan_stand', label: 'बाड़मेर → चौहटन' },
                    { from: 'barmer_stand', to: 'sindhari_stand', label: 'बाड़मेर → सिंधरी' }
                  ].map((route, i) => (
                    <button 
                      key={i}
                      onClick={() => navigate('RESULTS', { from: route.from, to: route.to })}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-5 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 hover:border-[var(--primary)]"
                    >
                      <BusIcon size={14} className="text-[var(--primary)]" />
                      {route.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {[
                  { icon: <Clock />, label: 'सही समय' },
                  { icon: <ShieldCheck />, label: 'सुरक्षित यात्री' },
                  { icon: <MapPin />, label: 'लाइव ट्रैकिंग' },
                  { icon: <Users />, label: 'भीड़ अलर्ट' }
                ].map((item, i) => (
                  <div key={i} className="card p-5 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="text-[var(--primary)]">{item.icon}</div>
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {nav.view === 'RESULTS' && (
            <motion.div 
              key="results-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              <div className="card p-4 mb-6 flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="font-black text-orange-500">{getStationName(nav.params.from).split(' ')[0]}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{getStationName(nav.params.from)}</p>
                </div>
                <ArrowRight size={16} className="text-orange-500" />
                <div className="flex-1 text-center">
                  <p className="font-black text-orange-500">{getStationName(nav.params.to).split(' ')[0]}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{getStationName(nav.params.to)}</p>
                </div>
              </div>

              {filteredBuses.length > 0 ? (
                filteredBuses.map(([id, bus]) => <BusCard key={id} id={id} bus={bus} />)
              ) : (
                <div className="text-center py-20 text-[var(--text-muted)]">
                  <BusIcon size={48} className="mx-auto mb-4 opacity-20" />
                  <p>कोई बस नहीं मिली</p>
                </div>
              )}
            </motion.div>
          )}

          {/* DETAIL VIEW */}
          {nav.view === 'DETAIL' && (
            <motion.div 
              key="detail-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-6"
            >
              {(() => {
                const bus = buses[nav.params.busId];
                if (!bus) return null;
                const route = routes[bus.routeId];
                
                return (
                  <div>
                    <div className="card p-5 mb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-black mb-1">{bus.busName}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono">{bus.busNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-orange-500">₹{bus.fare}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">प्रति सवारी</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <AmenityIcon type="ac" active={bus.amenities?.ac} />
                        <AmenityIcon type="sleeper" active={bus.amenities?.sleeper} />
                        <AmenityIcon type="wifi" active={bus.amenities?.wifi} />
                        <AmenityIcon type="charging" active={bus.amenities?.charging} />
                        <AmenityIcon type="water" active={bus.amenities?.water} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <Users size={20} className="mx-auto mb-1 text-orange-500" />
                          <p className="text-[10px] text-[var(--text-muted)]">भीड़</p>
                          <p className="text-xs font-bold">{bus.crowd}</p>
                        </div>
                        <div className="text-center">
                          <Bed size={20} className="mx-auto mb-1 text-orange-500" />
                          <p className="text-[10px] text-[var(--text-muted)]">सीटें</p>
                          <p className="text-xs font-bold">{bus.availableSeats}/{bus.totalSeats}</p>
                        </div>
                        <div className="text-center">
                          <MapPin size={20} className="mx-auto mb-1 text-orange-500" />
                          <p className="text-[10px] text-[var(--text-muted)]">दूरी</p>
                          <p className="text-xs font-bold">{route?.totalDistance || '60 किमी'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2">
                          <Ticket size={18} />
                          <span>टिकट बुक करें</span>
                        </button>
                        <button className="w-12 h-12 rounded-2xl border border-[var(--border)] flex items-center justify-center text-slate-500">
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-sm mb-4 px-1">समय सारणी (Trips)</h4>
                    {bus.trips?.map((trip, i) => {
                      const status = getTripStatus(trip);
                      const progress = getLiveProgress(trip);
                      return (
                        <div key={i} className="card p-4 mb-3">
                          <div className="flex justify-between items-center mb-4">
                            <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", trip.direction === 'forward' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500")}>
                              {trip.direction === 'forward' ? 'जाने वाली' : 'वापसी'}
                            </span>
                            {trip.delay > 0 && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">
                                {trip.delay} मिनट देरी
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-center flex-1">
                              <p className="text-lg font-black">{trip.departure}</p>
                              <p className="text-[9px] text-[var(--text-muted)] uppercase">प्रस्थान</p>
                            </div>
                            <div className="px-4">
                              <ArrowRight size={16} className="text-slate-300" />
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-lg font-black">{trip.arrival}</p>
                              <p className="text-[9px] text-[var(--text-muted)] uppercase">आगमन</p>
                            </div>
                          </div>
                          
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full bg-green-500"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400">{Math.round(progress)}% पूरा</span>
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", status.color)}>
                              {status.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* BUSES VIEW */}
          {nav.view === 'BUSES' && (
            <motion.div key="buses-content" className="py-6">
              <div className="card p-4 mb-6 flex items-center gap-3">
                <Search size={20} className="text-orange-500" />
                <input 
                  type="text" 
                  placeholder="बस नाम या नंबर से खोजें..." 
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {filteredBuses.length > 0 ? (
                filteredBuses.map(([id, bus]) => <BusCard key={id} id={id} bus={bus} />)
              ) : (
                <div className="text-center py-20 text-[var(--text-muted)]">
                  <p>कोई बस नहीं मिली</p>
                </div>
              )}
            </motion.div>
          )}

          {/* FAVORITES VIEW */}
          {nav.view === 'FAVORITES' && (
            <motion.div key="fav-content" className="py-6">
              {filteredBuses.length > 0 ? (
                filteredBuses.map(([id, bus]) => <BusCard key={id} id={id} bus={bus} />)
              ) : (
                <div className="text-center py-20 text-[var(--text-muted)]">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>कोई पसंदीदा बस नहीं</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ROUTES VIEW */}
          {nav.view === 'ROUTES' && (
            <motion.div key="routes-content" className="py-6">
              {Object.entries(routes).map(([id, route]) => (
                <div 
                  key={id} 
                  className="card p-4 mb-3 cursor-pointer hover:border-orange-500"
                  onClick={() => navigate('RESULTS', { from: route.fromStation, to: route.toStation })}
                >
                  <h4 className="font-bold text-orange-500 mb-2">{route.name}</h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold">{getStationName(route.fromStation)}</span>
                    <ArrowRight size={12} />
                    <span className="font-bold">{getStationName(route.toStation)}</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
                    <span>दूरी: {route.totalDistance}</span>
                    <span>समय: {route.forwardTravelTime}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-[var(--surface)] border-t border-[var(--border)] flex justify-around py-3 px-2 z-[100] backdrop-blur-lg bg-opacity-80">
        {[
          { icon: <HomeIcon />, label: 'होम', view: 'HOME' },
          { icon: <BusIcon />, label: 'बसें', view: 'BUSES' },
          { icon: <Heart />, label: 'पसंदीदा', view: 'FAVORITES' },
          { icon: <RouteIcon />, label: 'रूट', view: 'ROUTES' }
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => {
              setNav({ view: item.view as any, history: [] });
              setSearchTerm('');
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              nav.view === item.view ? "text-[var(--primary)] scale-110" : "text-[var(--text-muted)]"
            )}
          >
            {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
            <span className="text-[10px] font-bold">{item.label}</span>
            {nav.view === item.view && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-orange-500 rounded-full" />}
          </button>
        ))}
      </nav>

      {/* Station Picker Modal */}
      <AnimatePresence>
        {picker.show && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPicker({ ...picker, show: false })}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[450px] bg-[var(--surface)] rounded-t-[32px] max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h4 className="font-black text-lg">{picker.mode === 'from' ? 'कहाँ से?' : 'कहाँ तक?'}</h4>
                <button onClick={() => setPicker({ ...picker, show: false })} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ArrowLeft size={16} className="rotate-[-90deg]" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-[var(--surface2)] rounded-2xl p-3 flex items-center gap-3 mb-4">
                  <Search size={18} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="स्टेशन खोजें..." 
                    className="bg-transparent outline-none text-sm font-medium w-full"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-10">
                {Object.entries(stations).map(([id, station]) => (
                  <div 
                    key={id}
                    onClick={() => {
                      setSearchParams(p => ({ ...p, [picker.mode]: id }));
                      setPicker({ ...picker, show: false });
                    }}
                    className={cn(
                      "p-4 border-b border-[var(--border)] flex items-center gap-4 cursor-pointer hover:bg-orange-500/5",
                      (picker.mode === 'from' ? searchParams.from : searchParams.to) === id && "bg-orange-500/5"
                    )}
                  >
                    <MapPin size={18} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{station.nameHindi}</p>
                      <p className="text-[10px] text-slate-400">{station.name}</p>
                    </div>
                    {(picker.mode === 'from' ? searchParams.from : searchParams.to) === id && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
