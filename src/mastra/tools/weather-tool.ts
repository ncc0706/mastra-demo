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

export const weatherTool = createTool({
  id: 'get-weather',
  description: '获取指定位置的当前天气信息',
  inputSchema: z.object({
    location: z.string().describe('城市名称'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async (inputData) => {
    return await getWeather(inputData.location);
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

const getWeather = async (location: string) => {
  const geoData = await qWeatherFetch<QWeatherGeoResponse>(
    `/geo/v2/city/lookup?location=${encodeURIComponent(location)}&number=1&lang=zh`,
  );

  const city = geoData.location?.[0];
  if (!city) {
    throw new Error(`未找到城市「${location}」`);
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
};
