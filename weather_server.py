import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 51: "Light drizzle", 61: "Slight rain", 63: "Moderate rain",
    65: "Heavy rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 95: "Thunderstorm", 99: "Hail storm",
}


@mcp.tool()
def get_current_weather(city: str, latitude: float, longitude: float) -> str:
    """Get the current weather for a given city using its coordinates."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode"
        f"&timezone=auto"
    )
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    c = response.json()["current"]
    condition = WMO_CODES.get(c["weathercode"], f"Unknown (code {c['weathercode']})")
    return (
        f"Weather in {city}\n"
        f"Temperature : {c['temperature_2m']}°C\n"
        f"Humidity    : {c['relative_humidity_2m']}%\n"
        f"Wind        : {c['wind_speed_10m']} km/h\n"
        f"Condition   : {condition}\n"
        f"Time        : {c['time']}"
    )


@mcp.tool()
def get_weekly_forecast(city: str, latitude: float, longitude: float) -> str:
    """Get a 7-day weather forecast for a city using its coordinates."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
        f"&timezone=auto"
    )
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    daily = response.json()["daily"]
    lines = [f"7-Day Forecast for {city}", "-" * 40]
    for i in range(len(daily["time"])):
        condition = WMO_CODES.get(daily["weathercode"][i], f"Unknown (code {daily['weathercode'][i]})")
        lines.append(
            f"{daily['time'][i]}\n"
            f"  High: {daily['temperature_2m_max'][i]}°C  Low: {daily['temperature_2m_min'][i]}°C\n"
            f"  Rain: {daily['precipitation_sum'][i]} mm\n"
            f"  {condition}"
        )
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
