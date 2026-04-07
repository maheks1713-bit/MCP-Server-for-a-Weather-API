import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "weather-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_current_weather",
      description: "Get the current weather for a given city",
      inputSchema: {
        type: "object",
        properties: {
          city:      { type: "string",  description: "City name" },
          latitude:  { type: "number",  description: "Latitude" },
          longitude: { type: "number",  description: "Longitude" },
        },
        required: ["city", "latitude", "longitude"],
      },
    },
    {
      name: "get_weekly_forecast",
      description: "Get a 7-day weather forecast for a city",
      inputSchema: {
        type: "object",
        properties: {
          city:      { type: "string",  description: "City name" },
          latitude:  { type: "number",  description: "Latitude" },
          longitude: { type: "number",  description: "Longitude" },
        },
        required: ["city", "latitude", "longitude"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const { city, latitude, longitude } = args as {
    city: string;
    latitude: number;
    longitude: number;
  };

  if (name === "get_current_weather") {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode` +
      `&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok)
      return { content: [{ type: "text", text: `Failed to fetch weather for ${city}.` }] };

    const data = (await response.json()) as any;
    const c = data.current;

    return {
      content: [
        {
          type: "text",
          text:
            `Weather in ${city}\n` +
            `Temperature : ${c.temperature_2m}°C\n` +
            `Humidity    : ${c.relative_humidity_2m}%\n` +
            `Wind        : ${c.wind_speed_10m} km/h\n` +
            `Condition   : ${interpretWMOCode(c.weathercode)}\n` +
            `Time        : ${c.time}`,
        },
      ],
    };
  }

  if (name === "get_weekly_forecast") {
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

  return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
});

function interpretWMOCode(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 51: "Light drizzle", 61: "Slight rain", 63: "Moderate rain",
    65: "Heavy rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 95: "Thunderstorm", 99: "Hail storm",
  };
  return map[code] ?? `Unknown (code ${code})`;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch(console.error);
