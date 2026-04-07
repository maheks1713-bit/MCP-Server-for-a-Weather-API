import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "weather-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "get_current_weather",
  {
    description: "Get the current weather for a given city",
    inputSchema: {
      city: z.string().describe("City name"),
      latitude: z.number().describe("Latitude"),
      longitude: z.number().describe("Longitude"),
    },
  },
  async ({ city, latitude, longitude }) => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode` +
      `&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok)
      return {
        content: [{ type: "text", text: `Failed to fetch weather for ${city}.` }],
      };

    const data = (await response.json()) as any;
    const c = data.current;
    const desc = interpretWMOCode(c.weathercode);

    return {
      content: [
        {
          type: "text",
          text:
            `Weather in ${city}\n` +
            `Temperature : ${c.temperature_2m}°C\n` +
            `Humidity    : ${c.relative_humidity_2m}%\n` +
            `Wind        : ${c.wind_speed_10m} km/h\n` +
            `Condition   : ${desc}\n` +
            `Time        : ${c.time}`,
        },
      ],
    };
  }
);

server.registerTool(
  "get_weekly_forecast",
  {
    description: "Get a 7-day weather forecast for a city",
    inputSchema: {
      city: z.string().describe("City name"),
      latitude: z.number().describe("Latitude"),
      longitude: z.number().describe("Longitude"),
    },
  },
  async ({ city, latitude, longitude }) => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok)
      return { content: [{ type: "text", text: `Failed for ${city}.` }] };

    const data = (await response.json()) as any;
    const daily = data.daily;
    let out = `7-Day Forecast for ${city}\n${"-".repeat(40)}`;

    for (let i = 0; i < daily.time.length; i++) {
      out += `\n${daily.time[i]}`;
      out += `\n  High: ${daily.temperature_2m_max[i]}°C  Low: ${daily.temperature_2m_min[i]}°C`;
      out += `\n  Rain: ${daily.precipitation_sum[i]} mm`;
      out += `\n  ${interpretWMOCode(daily.weathercode[i])}`;
    }

    return { content: [{ type: "text", text: out }] };
  }
);

function interpretWMOCode(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    95: "Thunderstorm",
    99: "Hail storm",
  };
  return map[code] ?? `Unknown (code ${code})`;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch(console.error);
