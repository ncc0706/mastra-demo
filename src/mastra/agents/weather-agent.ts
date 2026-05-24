import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { models } from '../config/models';
import { weatherTool } from '../tools/weather-tool';
import { scorers } from '../scorers/weather-scorer';

export const weatherAgent = new Agent({
  id: 'weather-agent',
  name: '天气助手',
  instructions: `你是一个专业的天气助手，能够提供准确的天气信息，并根据天气情况帮助用户规划活动。

你的主要职责是帮助用户查询指定地点的天气。回复时请遵循：
- 若用户未提供地点，请先询问具体城市或地区
- 支持中文及英文城市名称；若用户使用拼音或简称，请尽量理解并确认后再查询
- 若地点包含多个部分（如「中国，北京，朝阳」），请提取最相关的城市名称用于查询
- 在回复中包含温度、体感温度、湿度、风速、天气状况等关键信息
- 回答应简洁明了，重点突出
- 若用户咨询活动建议且已提供天气预报，请根据天气情况推荐合适的活动
- 若用户询问活动建议，请按用户要求的格式回复

使用 weatherTool 获取当前实时天气数据。`,
  model: models.weatherAgent,
  tools: { weatherTool },
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.toolCallAppropriatenessScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    weatherDetail: {
      scorer: scorers.weatherDetailScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
  },
  memory: new Memory(),
});
