import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { fetchWeatherByLocation, weatherSchema } from '../tools/weather-tool';

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: '通过和风天气获取指定城市的实时天气',
  inputSchema: z.object({
    city: z.string().describe('城市名称'),
  }),
  outputSchema: weatherSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('缺少输入数据');
    }

    return await fetchWeatherByLocation(inputData.city);
  },
});

const planActivities = createStep({
  id: 'plan-activities',
  description: '根据实时天气推荐合适的活动',
  inputSchema: weatherSchema,
  outputSchema: z.object({
    activities: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const weather = inputData;

    if (!weather) {
      throw new Error('缺少天气数据');
    }

    const agent = mastra?.getAgent('weatherAgent');
    if (!agent) {
      throw new Error('未找到 weatherAgent');
    }

    const prompt = `请根据 ${weather.location} 的实时天气，推荐合适的活动安排：

${JSON.stringify(weather, null, 2)}

请按以下格式用中文回复：

📅 活动建议
═══════════════════════════

🌡️ 天气概况
• 地点：${weather.location}
• 天气：${weather.conditions}
• 温度：${weather.temperature}°C（体感 ${weather.feelsLike}°C）
• 湿度：${weather.humidity}%
• 风速：${weather.windSpeed} 公里/小时

🌅 上午活动
户外：
• [活动名称] - [简要说明，含具体地点或路线]
  建议时段：[具体时间]
  备注：[与天气相关的注意事项]

🌞 下午活动
户外：
• [活动名称] - [简要说明，含具体地点或路线]
  建议时段：[具体时间]
  备注：[与天气相关的注意事项]

🏠 室内备选
• [活动名称] - [简要说明，含具体场所]
  适用场景：[何种天气条件下优先选择]

⚠️ 特别提醒
• [如高温、大风、雨雪等需注意的事项]

要求：
- 每个时段推荐 2-3 个户外活动
- 提供 1-2 个室内备选方案
- 活动需结合当地特色，地点尽量具体
- 根据温度和天气状况调整活动强度
- 描述简洁、实用`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let activitiesText = '';

    for await (const chunk of response.textStream) {
      activitiesText += chunk;
    }

    return {
      activities: activitiesText,
    };
  },
});

const weatherWorkflow = createWorkflow({
  id: 'weather-workflow',
  inputSchema: z.object({
    city: z.string().describe('要查询天气的城市名称'),
  }),
  outputSchema: z.object({
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
