// client/src/weatherService.js
// The ONLY file that loads weather. Uses the free Open-Meteo API (no API key needed).
// https://open-meteo.com/en/docs

// Open-Meteo sends a "WMO weather code" number. This turns it into words + an icon type.
// The icon type ("clear", "rain", ...) is turned into an SVG icon by TimeWeatherCard.
const WEATHER_CODES = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloudy"],
  45: ["Fog", "fog"],
  48: ["Fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Drizzle", "drizzle"],
  55: ["Heavy drizzle", "drizzle"],
  56: ["Freezing drizzle", "drizzle"],
  57: ["Freezing drizzle", "drizzle"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Light rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Heavy rain showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with hail", "storm"],
  99: ["Thunderstorm with hail", "storm"],
};

// Returns { temperature, condition, kind, isDay } for right now.
// Throws an error if the weather can't be loaded (the card then shows "Weather unavailable").
export async function getWeather({ latitude, longitude, timezone }, signal) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    timezone,
    current: "temperature_2m,weather_code,is_day",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);

  const { current } = await response.json();
  const [condition, kind] = WEATHER_CODES[current.weather_code] ?? ["Unknown", "cloudy"];
  return {
    temperature: Math.round(current.temperature_2m),
    condition,
    kind,
    isDay: current.is_day === 1,
  };
}
