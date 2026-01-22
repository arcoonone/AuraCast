import React, { useState, useEffect, useRef } from 'react';
import { WeatherCard } from './components/WeatherCard';
import { OutfitDisplay } from './components/OutfitDisplay';
import { fetchWeatherForecast, generateFashionImages, searchCities } from './services/geminiService';
import { WeatherDay, OutfitGenerationResult, LoadingState, LocationSearchResult, Gender } from './types';

// Icons
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const GpsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Flag helper
const getCountryFlag = (countryCode?: string) => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

function App() {
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  
  // Search state
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchError, setIsSearchError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Weather list scrolling
  const weatherListRef = useRef<HTMLDivElement>(null);

  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<WeatherDay | null>(null);
  const [outfitData, setOutfitData] = useState<Record<string, OutfitGenerationResult>>({});
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);

  // Initial IP-based location estimation
  useEffect(() => {
    const fetchIpLocation = async () => {
        try {
            const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const data = await res.json();
            
            // Prefer coordinates if available to avoid "City not found" errors during geocoding
            if (data.latitude && data.longitude) {
                const coords = `${data.latitude},${data.longitude}`;
                const cityName = data.city || "Current Location";
                loadWeather(coords, cityName);
            } else if (data.city) {
                loadWeather(data.city, data.city);
            } else {
              throw new Error("Location info not found in IP data");
            }
        } catch (e) {
            console.error("IP loc failed, default to Tokyo", e);
            // Fallback
            loadWeather("Tokyo", "Tokyo");
        }
    };
    
    // Only run if we haven't initialized
    if (!city) fetchIpLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Weather Scroll Handlers
  const scrollWeather = (direction: 'left' | 'right') => {
    if (weatherListRef.current) {
      const scrollAmount = 300;
      weatherListRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Updated loadWeather to handle errors gracefully without clearing previous valid state immediately
  const loadWeather = async (query: string, displayName?: string) => {
    setLoadingState(LoadingState.FETCHING_WEATHER);
    setIsSearchError(false);
    
    // Determine the name to display on success
    const finalDisplayName = displayName || (query.includes(',') ? "Current Location" : query);

    try {
      const forecast = await fetchWeatherForecast(query);
      
      // Only update state if we successfully got data
      if (forecast.length > 0) {
        setWeatherData(forecast);
        setSelectedDay(forecast[0]);
        setCity(finalDisplayName);
        setInputCity(finalDisplayName);
        setOutfitData({}); // Clear cache only on new valid city
      } else {
        throw new Error("No weather data found");
      }
    } catch (e) {
      console.error("Load weather error:", e);
      setIsSearchError(true);
      
      // Auto-hide the error state after a few seconds
      setTimeout(() => setIsSearchError(false), 2500);

      // Fallback logic: 
      // If this is the initial load (no weather data yet), try a safe default
      if (weatherData.length === 0) {
        if (query !== 'Tokyo') {
           loadWeather('Tokyo', 'Tokyo');
        }
      }
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCity.trim()) return;

    // Trigger search for candidates
    try {
      const results = await searchCities(inputCity);
      setSearchResults(results);
      if (results.length > 0) {
        setShowDropdown(true);
      } else {
        // If no results via search, try direct load (graceful attempt)
        loadWeather(inputCity, inputCity);
        setShowDropdown(false);
      }
    } catch (e) {
       // If search fails, try loading directly
       loadWeather(inputCity, inputCity);
       setShowDropdown(false);
    }
  };

  const handleSelectLocation = (loc: LocationSearchResult) => {
    const displayName = `${loc.name}`; // We display just name in header, but could add country
    setShowDropdown(false);
    // Use lat/lon for precise weather fetching, pass name for display
    const coords = `${loc.latitude},${loc.longitude}`;
    loadWeather(coords, displayName);
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setShowDropdown(false);
    setLoadingState(LoadingState.FETCHING_WEATHER);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordsString = `${latitude},${longitude}`;
        // Use coordinates to load, display "Current Location"
        loadWeather(coordsString, "Current Location");
      },
      (err) => {
        console.error(err);
        setLoadingState(LoadingState.IDLE);
        setIsSearchError(true);
        setTimeout(() => setIsSearchError(false), 2500);
      }
    );
  };

  const handleDaySelect = (day: WeatherDay) => {
    setSelectedDay(day);
  };

  const handleGenerateOutfit = async (forceRefresh: boolean = false) => {
    if (!selectedDay || !city) return;
    
    // Check cache unless forcing refresh
    const cacheKey = `${selectedDay.date}-${gender}`;
    if (!forceRefresh && outfitData[cacheKey]) return;

    setLoadingState(LoadingState.GENERATING_OUTFIT);
    try {
      const locationContext = city === "Current Location" ? "your area" : city;
      const result = await generateFashionImages(locationContext, selectedDay, gender);
      setOutfitData(prev => ({
        ...prev,
        [cacheKey]: result
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to generate outfit images. Please try again.");
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const currentOutfit = selectedDay ? outfitData[`${selectedDay.date}-${gender}`] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900/30 rounded-full blur-[100px]" />
         <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-1/2 w-full h-64 bg-pink-900/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200 tracking-tight">
              AuraCast
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              Hyper-local weather & style intelligence
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto z-50">
            {/* Gender Selector - Height Matched to Search */}
             <div className="bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg flex items-center h-14">
                <div className="pl-2 pr-2 text-slate-400">
                  <UserIcon />
                </div>
                {(['Female', 'Male', 'Unisex'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-4 h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center ${
                      gender === g 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
             </div>

            {/* Search Component - Explicit Height Added */}
            <div className="relative flex-1" ref={searchRef}>
              <form 
                onSubmit={handleSearchSubmit} 
                className={`flex items-center gap-2 bg-slate-800/50 p-2 rounded-2xl border backdrop-blur-md shadow-lg h-14 transition-colors duration-300 ${
                  isSearchError 
                    ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'border-slate-700/50'
                }`}
              >
                <div className="relative flex-1 md:w-64">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isSearchError ? 'text-red-400' : 'text-slate-400'}`}>
                    <LocationIcon />
                  </div>
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => {
                      setInputCity(e.target.value);
                      if (isSearchError) setIsSearchError(false); // Clear error when typing
                    }}
                    placeholder={isSearchError ? "Location not found..." : "Enter city (e.g. Tokyo or 东京)"}
                    className={`block w-full pl-10 pr-3 py-2 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 font-medium ${isSearchError ? 'placeholder-red-400/50' : ''}`}
                    autoComplete="off"
                  />
                </div>
                
                <button 
                  type="button"
                  onClick={handleGps}
                  className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                  title="Use GPS"
                >
                  <GpsIcon />
                </button>
                
                <button 
                  type="submit"
                  className={`p-2 text-white rounded-xl transition-all shadow-md ${isSearchError ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  <SearchIcon />
                </button>
              </form>

              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-down z-50">
                  <ul>
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          onClick={() => handleSelectLocation(result)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-600/20 hover:text-white text-slate-300 transition-colors flex items-center justify-between group"
                        >
                          <span className="font-medium">
                            {result.name}
                            {result.admin1 && <span className="text-slate-500 font-normal text-sm ml-2">, {result.admin1}</span>}
                          </span>
                          <span className="text-sm opacity-50 group-hover:opacity-100 flex items-center gap-2">
                             {result.country} {getCountryFlag(result.country_code)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Loading / Error States */}
        {loadingState === LoadingState.FETCHING_WEATHER && weatherData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-xl text-indigo-300 font-medium">Consulting the oracles...</p>
          </div>
        )}

        {/* Weather Strip */}
        {weatherData.length > 0 && (
          <section className="mb-12 animate-fade-in group/weather">
            <div className="flex justify-between items-end mb-4 px-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-pink-500 rounded-full inline-block"></span>
                15-Day Forecast
              </h2>
              
              {/* Scroll Controls - Visible on all screens to ensure access to hidden cards */}
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollWeather('left')} 
                  className="p-2 rounded-full bg-slate-800/50 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition-all text-slate-300 hover:text-white"
                >
                  <ChevronLeft />
                </button>
                <button 
                  onClick={() => scrollWeather('right')} 
                  className="p-2 rounded-full bg-slate-800/50 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition-all text-slate-300 hover:text-white"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            
            <div className="relative">
              {/* Fade masks for scroll indication */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none md:hidden"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none md:hidden"></div>

              <div 
                ref={weatherListRef}
                className="flex overflow-x-auto gap-4 pb-6 pt-2 px-2 scrollbar-hide snap-x scroll-smooth"
              >
                {weatherData.map((day) => (
                  <WeatherCard 
                    key={day.date} 
                    day={day} 
                    isSelected={selectedDay?.date === day.date}
                    onClick={() => handleDaySelect(day)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Outfit Section */}
        {selectedDay && (
          <section className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <span className="text-3xl">🧥</span> 
                   Style Forecast for {selectedDay.dayOfWeek}
                </h2>
                <div className="hidden sm:block h-px w-24 bg-gradient-to-r from-slate-700 to-transparent"></div>
              </div>
            </div>

            <OutfitDisplay 
              data={currentOutfit || null}
              isLoading={loadingState === LoadingState.GENERATING_OUTFIT}
              selectedDay={selectedDay}
              onGenerate={() => handleGenerateOutfit(false)}
              onRefresh={() => handleGenerateOutfit(true)}
              city={city}
            />
          </section>
        )}

        {/* Footer with Credits */}
        <footer className="mt-20 border-t border-slate-800/50 pt-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
                Weather Data by Open-Meteo
              </a>
              <span className="hidden sm:block w-1 h-1 bg-slate-700 rounded-full"></span>
              <a href="https://pollinations.ai" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-pink-400 transition-colors group">
                <span>Built with</span>
                <span className="font-bold text-slate-300 group-hover:text-white transition-colors">pollinations.ai</span>
              </a>
            </div>
            <p className="text-xs text-slate-600">
               © {new Date().getFullYear()} AuraCast.
            </p>
        </footer>
      </div>
    </div>
  );
}

export default App;