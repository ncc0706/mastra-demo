import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface QWeatherGeoResponse {
  code: string;
  location?: {
    name: string;
    id: string;
    adm1: string;
    adm2: string;
  }[];
}

interface QWeatherNowResponse {
  code: string;
  now?: {
    temp: string;
    feelsLike: string;
    humidity: string;
    windSpeed: string;
    text: string;
  };
}

export const weatherSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number(),
  conditions: z.string(),
  location: z.string(),
});

export type WeatherData = z.infer<typeof weatherSchema>;

export const MISSING_CITY_MESSAGE =
  '请提供要查询的城市名称，例如：北京、上海、广州、深圳。';

export function validateCityName(city: string): string {
  const normalized = city.trim();
  if (!normalized) {
    throw new Error(MISSING_CITY_MESSAGE);
  }
  return normalized;
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: '获取指定位置的当前天气信息。调用前必须已有明确的城市名称，不可为空。',
  inputSchema: z.object({
    location: z
      .string()
      .describe('城市名称（必填），例如：北京、上海、广州'),
  }),
  outputSchema: weatherSchema,
  execute: async (inputData) => {
    const location = validateCityName(inputData.location);
    return await fetchWeatherByLocation(location);
  },
});

function getQWeatherHost(): string {
  const host = process.env.QWEATHER_API_HOST;
  if (!host) {
    throw new Error('未配置 QWEATHER_API_HOST 环境变量');
  }
  return host.replace(/\/$/, '');
}

function getQWeatherHeaders(): HeadersInit {
  const apiKey = process.env.QWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 QWEATHER_API_KEY 环境变量');
  }
  return { 'X-QW-Api-Key': apiKey };
}

async function qWeatherFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://${getQWeatherHost()}${path}`, {
    headers: getQWeatherHeaders(),
  });
  const data = (await response.json()) as T & { code?: string };
  if (data.code !== '200') {
    throw new Error(`和风天气 API 请求失败，错误码：${data.code ?? 'unknown'}`);
  }
  return data;
}

export async function fetchWeatherByLocation(location: string): Promise<WeatherData> {
  const cityName = validateCityName(location);

  const geoData = await qWeatherFetch<QWeatherGeoResponse>(
    `/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&number=1&lang=zh`,
  );

  const city = geoData.location?.[0];
  if (!city) {
    throw new Error(`未找到城市「${cityName}」，请检查名称是否正确，或尝试更具体的地名（如「北京朝阳」）。`);
  }

  const weatherData = await qWeatherFetch<QWeatherNowResponse>(
    `/v7/weather/now?location=${city.id}&lang=zh&unit=m`,
  );

  const now = weatherData.now;
  if (!now) {
    throw new Error(`无法获取「${city.name}」的实时天气数据`);
  }

  const locationName = city.adm1 === city.name ? city.name : `${city.adm1} ${city.name}`;

  return {
    temperature: Number(now.temp),
    feelsLike: Number(now.feelsLike),
    humidity: Number(now.humidity),
    windSpeed: Number(now.windSpeed),
    windGust: 0,
    conditions: now.text,
    location: locationName,
  };
}
