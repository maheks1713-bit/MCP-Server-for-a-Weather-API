# Weather MCP Server

An MCP (Model Context Protocol) server that exposes real-time weather data to Claude Desktop via the free [Open-Meteo](https://open-meteo.com/) API. No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `get_current_weather` | Current temperature, humidity, wind speed, and condition for a city |
| `get_weekly_forecast` | 7-day daily forecast (high/low, precipitation, condition) for a city |

## Prerequisites

- Node.js 18+
- npm
- Claude Desktop app

## Installation

```bash
git clone https://github.com/maheks1713-bit/MCP-Server-for-a-Weather-API.git
cd MCP-Server-for-a-Weather-API
npm install
npm run build
```

## Claude Desktop Configuration

Open `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\Users\\mahek\\MCP-Server-for-a-Weather-API\\build\\index.js"]
    }
  }
}
```

Fully quit and reopen Claude Desktop. The weather tools will appear in the MCP tools panel (hammer icon).

## Example Prompts

```
What is the current weather in Halifax? latitude 44.65, longitude -63.57
Show me the weather in Tokyo right now. lat: 35.68, lon: 139.69
Give me a 7-day forecast for London. lat: 51.51, lon: -0.13
Will it rain in Vancouver this week? lat: 49.25, lon: -123.12
```

## Common City Coordinates

| City      | Latitude | Longitude |
|-----------|----------|-----------|
| Halifax   | 44.65    | -63.57    |
| Toronto   | 43.65    | -79.38    |
| Vancouver | 49.25    | -123.12   |
| New York  | 40.71    | -74.01    |
| London    | 51.51    | -0.13     |
| Tokyo     | 35.68    | 139.69    |
| Sydney    | -33.87   | 151.21    |
| Paris     | 48.85    | 2.35      |
