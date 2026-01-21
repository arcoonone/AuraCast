# AuraCast 🌦️🧥

**AuraCast** is a vivid, hyper-local weather forecast tool that combines meteorological data with generative AI to provide culturally relevant fashion recommendations.

It doesn't just tell you it's raining—it shows you exactly what to wear, visualizing both a stylish outfit on a model and a detailed item breakdown (knolling) based on the specific location, temperature, and local fashion trends.

![截图](./images/x.webp "截图")

## ✨ Features

- **Hyper-Local Weather:** 
  - Accurate 15-day forecasts using Open-Meteo data.
  - IP-based auto-location and GPS support for precise local data.
  - Global city search with autocomplete.

- **AI Fashion Stylist:**
  - **Context-Aware:** Generates outfits based on city (cultural context), weather condition, and temperature.
  - **Dual Visualization:** 
    1. **The Look:** A high-fashion, photorealistic street style shot.
    2. **The Breakdown:** A clean, flat-lay (knolling) photography style showing individual items.
  - **Gender Options:** Supports Female, Male, and Unisex style generation.
  - **Descriptive Insights:** Provides a text summary of the recommended style.

- **Modern UI/UX:**
  - Glassmorphism design with dynamic background ambience.
  - Fully responsive layout built with Tailwind CSS.
  - Smooth animations and loading states.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **APIs:**
  - **Weather & Geocoding:** [Open-Meteo](https://open-meteo.com/) (Free, open-source weather API).
  - **Generative AI:** [Pollinations.ai](https://pollinations.ai/) (Used for generating text descriptions and rendering images).
  - **IP Geolocation:** [GeoJS](https://www.geojs.io/).

## 🚀 Getting Started

### Prerequisites

This project relies on standard web technologies. No complex backend setup is required as it consumes public APIs directly from the client.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/auracast.git
   cd auracast
   ```

2. **Install dependencies**
   *(Note: The current structure uses ES modules via CDN in `index.html`, but if running locally with a bundler like Vite)*:
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```
├── components/
│   ├── ApiKeySelector.tsx    # (Optional) Module for API key management
│   ├── OutfitDisplay.tsx     # Displays AI generated images and descriptions
│   └── WeatherCard.tsx       # Individual day forecast card
├── services/
│   └── geminiService.ts      # Handles API calls to Open-Meteo and Pollinations AI
├── types.ts                  # TypeScript interfaces and enums
├── App.tsx                   # Main application logic and layout
├── index.html                # Entry point
└── index.tsx                 # React DOM rendering
```

## 🧩 How it Works

1. **Location:** The app determines location via IP or GPS. Coordinates are sent to Open-Meteo.
2. **Weather:** Returns a 15-day forecast including weather codes (WMO), min/max temps.
3. **Selection:** User selects a specific day and gender.
4. **Generation:** 
   - A text prompt is constructed: `"{Gender} outfit in {City} for {Condition} weather..."`.
   - This prompt is sent to an LLM to generate a detailed fashion description.
   - That description is fed into an Image Generation model to create the "Street Style" and "Flat Lay" images simultaneously.

## 📄 License

This project is open source.

---

*Note: This application uses third-party AI services. Generation times may vary based on API load.*
