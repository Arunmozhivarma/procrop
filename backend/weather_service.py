import requests
import datetime

# Coimbatore Coordinates
COIMBATORE_LAT = 11.0168
COIMBATORE_LON = 76.9558

def fetch_coimbatore_weather():
    """
    Fetches real-time weather parameters for Coimbatore, Tamil Nadu from Open-Meteo API.
    Returns dictionary with max_temp_c, min_temp_c, rh_morning_pct, rh_evening_pct,
    rainfall_mm, rainy_days, wind_speed_kmh, sunshine_hours, mean_temp_c, mean_rh_pct.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={COIMBATORE_LAT}&longitude={COIMBATORE_LON}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,windspeed_10m_max,sunshine_duration"
        f"&hourly=relative_humidity_2m,temperature_2m"
        f"&timezone=Asia%2FKolkata"
    )
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            daily = data.get("daily", {})
            hourly = data.get("hourly", {})
            
            # Extract daily max/min temp, rainfall, wind, sunshine
            required_daily = ("temperature_2m_max", "temperature_2m_min", "precipitation_sum", "windspeed_10m_max")
            if any(not daily.get(key) or daily[key][0] is None for key in required_daily):
                raise ValueError("Open-Meteo response is missing required daily weather columns")
            max_temp = float(daily["temperature_2m_max"][0])
            min_temp = float(daily["temperature_2m_min"][0])
            rainfall = float(daily["precipitation_sum"][0])
            raw_wind = float(daily["windspeed_10m_max"][0])
            
            # Scale wind speed (km/h) to average weekly wind speed range in dataset (5.0 to 11.0)
            wind_speed = min(11.0, max(5.0, round(raw_wind * 0.55, 1)))

            # Sunshine duration in seconds -> hours
            sun_values = daily.get("sunshine_duration")
            if not sun_values or sun_values[0] is None:
                raise ValueError("Open-Meteo response is missing sunshine_duration")
            sun_sec = sun_values[0]
            sunshine_hours = round(min(10.0, max(4.0, sun_sec / 3600.0)), 1)
            
            # Hourly relative humidity at 08:00 AM (idx 8) and 05:00 PM (idx 17)
            humidity = hourly.get("relative_humidity_2m")
            if not humidity or len(humidity) < 18 or humidity[8] is None or humidity[17] is None:
                raise ValueError("Open-Meteo response is missing hourly humidity values")
            rh_morning = float(humidity[8])
            rh_evening = float(humidity[17])
            
            # Rainy days in recent week forecast
            precip_list = daily.get("precipitation_sum", [rainfall])
            rainy_days = sum(1 for p in precip_list if p is not None and p > 1.0)
            if rainy_days == 0 and rainfall > 0:
                rainy_days = 1
                
            mean_temp = round((max_temp + min_temp) / 2.0, 1)
            mean_rh = round((rh_morning + rh_evening) / 2.0, 1)
            
            return {
                "source": "Open-Meteo Real-Time Weather API (Coimbatore Station)",
                "location": "Coimbatore, Tamil Nadu (11.0168° N, 76.9558° E)",
                "max_temp_c": round(max_temp, 1),
                "min_temp_c": round(min_temp, 1),
                "rh_morning_pct": round(rh_morning, 1),
                "rh_evening_pct": round(rh_evening, 1),
                "rainfall_mm": round(rainfall, 1),
                "rainy_days": rainy_days,
                "wind_speed_kmh": round(wind_speed, 1),
                "sunshine_hours": sunshine_hours,
                "mean_temp_c": mean_temp,
                "mean_rh_pct": mean_rh,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    except Exception as e:
        print(f"Weather API fallback triggered: {e}")
        
    raise RuntimeError("Live Open-Meteo weather is unavailable; no fallback measurements are used")
