// OpenWeatherMap — Live weather data → hazard derivation
const OWM_KEY = import.meta.env.VITE_OWM_KEY || '';

const WEATHER_CONDITION_MAP = {
  2: { name: 'Thunderstorm', type: 'storm', severity: 'EXTREME', recommendation: 'Seek reinforced shelter immediately. Stay off roads.' },
  3: { name: 'Heavy Drizzle', type: 'flood', severity: 'MODERATE', recommendation: 'Roads may be slippery. Reduce speed and avoid tunnels.' },
  5: { name: 'Heavy Rain', type: 'flood', severity: 'HIGH', recommendation: 'Flash flood risk. Move to higher ground.' },
  6: { name: 'Snowstorm', type: 'snow', severity: 'HIGH', recommendation: 'Avoid travel. If driving, use chains and stay on main roads.' },
  7: { name: 'Extreme Fog', type: 'visibility', severity: 'MODERATE', recommendation: 'Drive with fog lights. Maintain safe following distance.' },
  9: { name: 'Extreme Winds', type: 'wind', severity: 'HIGH', recommendation: 'Danger of falling debris. Avoid tall trees and structures.' },
};

/**
 * Fetch live weather for a location and derive hazard conditions.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{weather: object, hazards: Array}>}
 */
export async function fetchWeatherHazards(lat, lon) {
  if (!OWM_KEY || OWM_KEY === 'your_openweathermap_api_key_here' || OWM_KEY === '') {
    return getDemoWeather(lat, lon);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
    const res = await fetch(url);
    
    // If the key is not yet active (OWM often takes 30-60 mins), fallback to demo mode
    if (res.status === 401 || res.status === 403) {
      console.warn('Weather API key not yet active. Falling back to Demo Mode.');
      return getDemoWeather(lat, lon);
    }
    
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    const conditionId = Math.floor(data.weather[0].id / 100);
    const hazards = [];
    const mapped = WEATHER_CONDITION_MAP[conditionId];

    if (mapped) {
      hazards.push({
        id: `wx-${Date.now()}`,
        name: mapped.name,
        type: mapped.type,
        severity: mapped.severity,
        description: data.weather[0].description,
        recommendation: mapped.recommendation,
        coords: [lon + 0.01, lat - 0.01],
        isWeatherDerived: true,
      });
    }

    // High wind speed
    if (data.wind?.speed > 15) {
      hazards.push({
        id: `wx-wind-${Date.now()}`,
        name: 'High Wind Advisory',
        type: 'wind',
        severity: data.wind.speed > 25 ? 'EXTREME' : 'HIGH',
        description: `Sustained winds at ${Math.round(data.wind.speed * 3.6)} km/h`,
        recommendation: 'Seek shelter from wind. Danger of falling branches.',
        coords: [lon - 0.01, lat + 0.01],
        isWeatherDerived: true,
      });
    }

    return {
      weather: {
        city: data.name,
        country: data.sys?.country,
        temp: Math.round(data.main?.temp),
        feels_like: Math.round(data.main?.feels_like),
        description: data.weather[0]?.description,
        humidity: data.main?.humidity,
        windSpeed: Math.round((data.wind?.speed || 0) * 3.6),
        icon: data.weather[0]?.icon,
        demoMode: false,
      },
      hazards,
    };
  } catch (err) {
    console.error('Weather fetch error:', err);
    return getDemoWeather(lat, lon);
  }
}

function getDemoWeather(lat, lon) {
  return {
    weather: {
      city: 'Your Location',
      temp: 22,
      description: 'partly cloudy',
      humidity: 65,
      windSpeed: 18,
      demoMode: true,
    },
    hazards: [
      {
        id: 'demo-flood',
        name: 'Flash Flood Warning',
        type: 'flood',
        severity: 'HIGH',
        description: 'Heavy rainfall reported upstream. Flooding risk in low-lying areas.',
        recommendation: 'Move to higher ground. Avoid crossing flooded roads.',
        coords: [lon + 0.03, lat - 0.02],
        isWeatherDerived: true,
      },
      {
        id: 'demo-fire',
        name: 'Wildfire Alert',
        type: 'fire',
        severity: 'EXTREME',
        description: 'Active fire reported. Smoke visible from multiple districts.',
        recommendation: 'Evacuate immediately upwind. Close all air vents.',
        coords: [lon - 0.04, lat + 0.03],
        isWeatherDerived: true,
      },
      {
        id: 'demo-wind',
        name: 'Wind Advisory',
        type: 'wind',
        severity: 'MODERATE',
        description: 'Gusts up to 65 km/h reported near coastal areas.',
        recommendation: 'Secure loose objects. Avoid open elevated areas.',
        coords: [lon + 0.02, lat + 0.04],
        isWeatherDerived: true,
      },
    ],
  };
}
