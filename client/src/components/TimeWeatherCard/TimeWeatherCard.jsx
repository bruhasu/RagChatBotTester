import { useEffect, useState } from "react";
import {
  CalendarDays, Clock, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudOff,
  CloudRain, CloudSun, MapPin, Moon, Snowflake, Sun,
} from "lucide-react";
import { getWeather } from "../../weatherService.js";
import "./TimeWeatherCard.css";

const WEATHER_REFRESH_MINUTES = 15;

// Which SVG icon to show for each weather type from weatherService.js.
// Clear and partly cloudy skies get a moon icon at night.
const WEATHER_ICONS = {
  clear: [Sun, Moon],
  partly: [CloudSun, CloudMoon],
  cloudy: [Cloud, Cloud],
  fog: [CloudFog, CloudFog],
  drizzle: [CloudDrizzle, CloudDrizzle],
  rain: [CloudRain, CloudRain],
  storm: [CloudLightning, CloudLightning],
  snow: [Snowflake, Snowflake],
};

// Small card with the live time, today's date, the place, and the current weather.
// "place" comes from tenantConfig.js: { location, latitude, longitude, timezone }.
// The time always uses place.timezone, even if this computer's clock is set to another country.
export default function TimeWeatherCard({ place }) {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState(null); // null = still loading
  const [weatherFailed, setWeatherFailed] = useState(false);

  // Tick every second.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load the weather now, then again every 15 minutes.
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setWeather(await getWeather(place, controller.signal));
        setWeatherFailed(false);
      } catch (err) {
        if (controller.signal.aborted) return; // the page was closed, not a real error
        console.error("Weather failed to load:", err);
        setWeatherFailed(true);
      }
    }
    load();
    const timer = setInterval(load, WEATHER_REFRESH_MINUTES * 60 * 1000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [place]);

  // "2:14:05 PM" and "Friday, October 23, 2026" in the place's timezone
  const time = now.toLocaleTimeString("en-US", {
    timeZone: place.timezone, hour: "numeric", minute: "2-digit", second: "2-digit",
  });
  const date = now.toLocaleDateString("en-US", {
    timeZone: place.timezone, weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  let weatherContent;
  if (weatherFailed) {
    weatherContent = (
      <>
        <CloudOff className="tw-weather-icon" aria-hidden="true" />
        <span className="tw-weather-text">Weather unavailable</span>
      </>
    );
  } else if (!weather) {
    weatherContent = <span className="tw-weather-text">Loading weather…</span>;
  } else {
    const [DayIcon, NightIcon] = WEATHER_ICONS[weather.kind];
    const WeatherIcon = weather.isDay ? DayIcon : NightIcon;
    weatherContent = (
      <>
        <WeatherIcon className="tw-weather-icon" aria-hidden="true" />
        <span className="tw-temp">{weather.temperature}°C</span>
        <span className="tw-weather-text">{weather.condition}</span>
      </>
    );
  }

  return (
    <section className="tw-card" aria-label={`Time and weather in ${place.location}`}>
      <div className="tw-top">
        <p className="tw-time">
          <Clock aria-hidden="true" />
          <time dateTime={now.toISOString()}>{time}</time>
        </p>
        <p className="tw-weather">{weatherContent}</p>
      </div>
      <div className="tw-bottom">
        <p>
          <CalendarDays aria-hidden="true" />
          {date}
        </p>
        <p>
          <MapPin aria-hidden="true" />
          {place.location}
        </p>
      </div>
    </section>
  );
}
