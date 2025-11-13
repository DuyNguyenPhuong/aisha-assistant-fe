// OpenWeather API integration for realtime weather data
import React from "react";

export interface WeatherData {
  temperature: number; // °C
  rainfall: number; // mm/hr
  location: string;
  timestamp: number;
  // Thông tin chi tiết thêm
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // độ
  visibility: number; // m
  cloudiness: number; // %
  feelsLike: number; // °C
  description: string; // mô tả thời tiết
  icon: string; // icon code
  sunrise: number; // timestamp
  sunset: number; // timestamp
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get current weather for Hanoi (default location for river simulation)
   */
  async getCurrentWeather(lat = 21.0285, lon = 105.8542): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`,
      );
      console.log(response);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract rainfall from rain object
      let rainfall = 0;
      if (data.rain) {
        // OpenWeather provides rain.1h (last hour) or rain.3h (last 3 hours)
        if (data.rain["1h"]) {
          rainfall = data.rain["1h"]; // mm in last hour
        } else if (data.rain["3h"]) {
          rainfall = data.rain["3h"] / 3; // Convert 3h to mm/hr
        }
      }

      return {
        temperature: data.main.temp,
        rainfall,
        location: data.name,
        timestamp: Date.now(),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        visibility: data.visibility || 10000,
        cloudiness: data.clouds?.all || 0,
        feelsLike: data.main.feels_like,
        description: data.weather[0]?.description || "clear sky",
        icon: data.weather[0]?.icon || "01d",
        sunrise: data.sys?.sunrise ? data.sys.sunrise * 1000 : Date.now(),
        sunset: data.sys?.sunset ? data.sys.sunset * 1000 : Date.now(),
      };
    } catch (error) {
      console.error("Failed to fetch weather data:", error);

      // Return fallback data
      return {
        temperature: 31,
        rainfall: 10,
        location: "Hanoi (fallback)",
        timestamp: Date.now(),
        humidity: 70,
        pressure: 1013,
        windSpeed: 2,
        windDirection: 180,
        visibility: 10000,
        cloudiness: 50,
        feelsLike: 26,
        description: "clear sky",
        icon: "01d",
        sunrise: Date.now() - 6 * 3600 * 1000, // 6 giờ trước
        sunset: Date.now() + 12 * 3600 * 1000, // 12 giờ sau
      };
    }
  }

  async getForecast(
    lat = 21.0285,
    lon = 105.8542,
    hours = 24,
  ): Promise<WeatherData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`,
      );

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.list.slice(0, hours / 3).map((item: any) => ({
        temperature: item.main.temp,
        rainfall: item.rain ? (item.rain["3h"] || 0) / 3 : 0,
        location: data.city.name,
        timestamp: item.dt * 1000,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind?.speed || 0,
        windDirection: item.wind?.deg || 0,
        visibility: item.visibility || 10000,
        cloudiness: item.clouds?.all || 0,
        feelsLike: item.main.feels_like,
        description: item.weather[0]?.description || "clear sky",
        icon: item.weather[0]?.icon || "01d",
        sunrise: data.city.sunrise ? data.city.sunrise * 1000 : Date.now(),
        sunset: data.city.sunset ? data.city.sunset * 1000 : Date.now(),
      }));
    } catch (error) {
      console.error("Failed to fetch forecast data:", error);
      return [];
    }
  }
}

// Singleton instance for the app
let weatherService: WeatherService | null = null;

export const getWeatherService = (): WeatherService => {
  if (!weatherService) {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn(
        "OpenWeather API key not found. Weather features will use fallback data.",
      );
      // Create service with dummy key - will return fallback data
      weatherService = new WeatherService("dummy");
    } else {
      weatherService = new WeatherService(apiKey);
    }
  }
  return weatherService;
};

// Hook for React components to use weather data
export const useWeatherData = (autoRefresh = false, interval = 300000) => {
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWeather = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const service = getWeatherService();
      const data = await service.getCurrentWeather();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  React.useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(fetchWeather, interval);
    return () => clearInterval(timer);
  }, [autoRefresh, interval, fetchWeather]);

  return {
    weatherData,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
