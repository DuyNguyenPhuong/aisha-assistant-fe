
import React from "react";

export interface WeatherData {
  temperature: number; 
  rainfall: number; 
  location: string;
  timestamp: number;
  
  humidity: number; 
  pressure: number; 
  windSpeed: number; 
  windDirection: number; 
  visibility: number; 
  cloudiness: number; 
  feelsLike: number; 
  description: string; 
  icon: string; 
  sunrise: number; 
  sunset: number; 
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = "https:

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  
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

      
      let rainfall = 0;
      if (data.rain) {
        
        if (data.rain["1h"]) {
          rainfall = data.rain["1h"]; 
        } else if (data.rain["3h"]) {
          rainfall = data.rain["3h"] / 3; 
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
        sunrise: Date.now() - 6 * 3600 * 1000, 
        sunset: Date.now() + 12 * 3600 * 1000, 
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


let weatherService: WeatherService | null = null;

export const getWeatherService = (): WeatherService => {
  if (!weatherService) {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn(
        "OpenWeather API key not found. Weather features will use fallback data.",
      );
      
      weatherService = new WeatherService("dummy");
    } else {
      weatherService = new WeatherService(apiKey);
    }
  }
  return weatherService;
};


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
