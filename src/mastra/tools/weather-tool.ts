import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { WEATHER_QUERY_MENU } from '../prompts/weather-prompts';

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

interface IpApiResponse {
  status: string;
  message?: string;
  city?: string;
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

export const weatherToolInputSchema = z.object({
  queryType: z
    .enum(['city', 'ip'])
    .describe('查询方式：city=按城市名；ip=按 IP 定位（仅当用户明确选择菜单 A 时使用）'),
  location: z.string().optional().describe('城市名称，queryType 为 city 时必填'),
  clientIp: z.string().optional().describe('客户端 IP，queryType 为 ip 时可选'),
});

export function validateCityName(city: string): string {
  const normalized = city.trim();
  if (!normalized) {
    throw new Error(WEATHER_QUERY_MENU);
  }
  return normalized;
}

export const weatherTool = createTool({
  id: 'get-weather',
  description:
    '获取指定位置的当前天气。' +
    '用户未明确选择菜单 A 时禁止使用 queryType=ip；' +
    '用户未提供城市名且未选 B/C 时禁止调用本工具。',
  inputSchema: weatherToolInputSchema,
  outputSchema: weatherSchema,
  execute: async (inputData) => {
    if (inputData.queryType === 'ip') {
      return await fetchWeatherByIp(inputData.clientIp);
    }

    const location = validateCityName(inputData.location ?? '');
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

function formatLocationName(city: { name: string; adm1: string }): string {
  return city.adm1 === city.name ? city.name : `${city.adm1} ${city.name}`;
}

async function fetchWeatherNow(
  locationQuery: string,
  locationName: string,
): Promise<WeatherData> {
  const weatherData = await qWeatherFetch<QWeatherNowResponse>(
    `/v7/weather/now?location=${encodeURIComponent(locationQuery)}&lang=zh&unit=m`,
  );

  const now = weatherData.now;
  if (!now) {
    throw new Error(`无法获取「${locationName}」的实时天气数据`);
  }

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

export async function resolveCityFromIp(clientIp?: string): Promise<string> {
  const endpoint = clientIp
    ? `http://ip-api.com/json/${encodeURIComponent(clientIp)}?lang=zh-CN&fields=status,message,city`
    : 'http://ip-api.com/json/?lang=zh-CN&fields=status,message,city';

  const response = await fetch(endpoint);
  const data = (await response.json()) as IpApiResponse;

  if (data.status !== 'success' || !data.city) {
    throw new Error(
      data.message ?? '无法根据 IP 定位城市，请选择 B 手动输入城市名称。',
    );
  }

  return data.city;
}

export async function fetchWeatherByIp(clientIp?: string): Promise<WeatherData> {
  const city = await resolveCityFromIp(clientIp);
  return fetchWeatherByLocation(city);
}

export async function fetchWeatherByLocation(location: string): Promise<WeatherData> {
  const cityName = validateCityName(location);

  const geoData = await qWeatherFetch<QWeatherGeoResponse>(
    `/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&number=1&lang=zh`,
  );

  const city = geoData.location?.[0];
  if (!city) {
    throw new Error(
      `未找到城市「${cityName}」，请检查名称是否正确，或尝试更具体的地名（如「北京朝阳」）。`,
    );
  }

  return fetchWeatherNow(city.id, formatLocationName(city));
}
