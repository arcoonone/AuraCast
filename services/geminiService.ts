import { WeatherDay, OutfitGenerationResult, LocationSearchResult } from "../types";

const POLLINATIONS_API_KEY = "pk_TciVoSMb9O1XiPaE";

// Helper for WMO Weather Codes (Open-Meteo)
const mapWmoCodeToCondition = (code: number): { condition: string; icon: string } => {
  if (code === 0) return { condition: "Clear Sky", icon: "sunny" };
  if (code >= 1 && code <= 3) return { condition: "Partly Cloudy", icon: "cloudy" };
  if (code >= 45 && code <= 48) return { condition: "Foggy", icon: "foggy" };
  if (code >= 51 && code <= 67) return { condition: "Rainy", icon: "rainy" };
  if (code >= 71 && code <= 77) return { condition: "Snowy", icon: "snowy" };
  if (code >= 80 && code <= 82) return { condition: "Rain Showers", icon: "rainy" };
  if (code >= 95 && code <= 99) return { condition: "Thunderstorm", icon: "stormy" };
  return { condition: "Cloudy", icon: "cloudy" };
};

// 1. Geocoding / Search
export const searchCities = async (query: string): Promise<LocationSearchResult[]> => {
  // language=en ensures the metadata (Country name etc) is in English for the UI, 
  // but Open-Meteo matches native language queries (e.g. "东京") correctly.
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
};

const getCoordinates = async (city: string) => {
  const results = await searchCities(city);
  if (results.length === 0) {
    throw new Error("City not found");
  }
  return results[0]; // { latitude, longitude, name, country }
};

// 2. Weather Fetching (Open-Meteo)
export const fetchWeatherForecast = async (locationQuery: string): Promise<WeatherDay[]> => {
  try {
    // Determine if input is "lat,lon" or a city name
    let lat: number, lon: number;
    const coordsMatch = locationQuery.match(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/);
    
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lon = parseFloat(coordsMatch[3]);
    } else {
      const locationData = await getCoordinates(locationQuery);
      lat = locationData.latitude;
      lon = locationData.longitude;
    }

    // Fetch 15-day forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`;
    const res = await fetch(weatherUrl);
    const data = await res.json();

    if (!data.daily) throw new Error("No weather data found");

    const daily = data.daily;
    const forecast: WeatherDay[] = [];

    // Map the raw data to our WeatherDay interface
    for (let i = 0; i < daily.time.length; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const { condition, icon } = mapWmoCodeToCondition(daily.weather_code[i]);

        forecast.push({
            date: dateStr,
            dayOfWeek: dayOfWeek,
            maxTemp: daily.temperature_2m_max[i],
            minTemp: daily.temperature_2m_min[i],
            condition: condition,
            description: `${condition}, High: ${daily.temperature_2m_max[i]}°C`,
            icon: icon
        });
    }

    return forecast.slice(0, 15);

  } catch (error) {
    console.error("Error fetching weather:", error);
    throw new Error("Failed to fetch weather data.");
  }
};

// Helper to fetch image with Auth header and convert to Base64
const fetchAuthenticatedImage = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${POLLINATIONS_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 3. Fashion Generation (Pollinations AI)
export const generateFashionImages = async (
  city: string, 
  weather: WeatherDay
): Promise<OutfitGenerationResult> => {
  try {
    const promptText = `Describe a stylish, culturally appropriate outfit for a person in ${city} where the weather is ${weather.condition} and temperature is between ${weather.minTemp}C and ${weather.maxTemp}C. Do not use markdown. Just pure text describing the outfit in 2 sentences.`;

    // 3a. Generate Description via Pollinations Text
    const seed = Math.floor(Math.random() * 100000);
    // Sanitize prompt for URL
    const safePromptText = promptText.replace(/[\r\n]+/g, " ").trim();
    const textUrl = `https://gen.pollinations.ai/text/${encodeURIComponent(safePromptText)}?seed=${seed}&model=gemini-fast`;
    
    const textRes = await fetch(textUrl, {
      headers: {
        'Authorization': `Bearer ${POLLINATIONS_API_KEY}`
      }
    });
    
    if (!textRes.ok) throw new Error(`Failed to generate text description: ${textRes.status}`);
    const outfitDescription = await textRes.text();

    // 3b. Generate Images via Pollinations Image (fetch as Blob with Auth)
    const imageSeed = Math.floor(Math.random() * 100000);
    
    // Sanitize description for URL
    const safeDescription = outfitDescription.replace(/[\r\n]+/g, " ").trim();
    
    const outfitPrompt = `Full body street style photo of a person in ${city} wearing ${safeDescription}. Weather: ${weather.condition}. High fashion, photorealistic, 8k, cinematic lighting.`;
    const breakdownPrompt = `Knolling flat lay photography of fashion items: ${safeDescription}. Clean neutral background, organized layout, high quality product photography.`;

    // Encode path components properly
    const outfitUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(outfitPrompt)}?model=klein&width=768&height=1024&nologo=true&seed=${imageSeed}`;
    const breakdownUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(breakdownPrompt)}?model=zimage&width=768&height=1024&nologo=true&seed=${imageSeed + 1}`;

    // Execute fetches in parallel
    const [outfitImage, breakdownImage] = await Promise.all([
      fetchAuthenticatedImage(outfitUrl),
      fetchAuthenticatedImage(breakdownUrl)
    ]);

    return {
      outfitImage,
      breakdownImage,
      description: outfitDescription
    };

  } catch (error) {
    console.error("Error generating fashion:", error);
    // Throwing here so the UI can show an alert or error state if needed, 
    // or return nulls if we want partial success. 
    // The App.tsx alerts on error, so we throw.
    throw error;
  }
};