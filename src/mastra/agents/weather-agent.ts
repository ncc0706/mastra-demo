import { Agent } from '@mastra/core/agent';
import { models } from '../config/models';
import { weatherAgentMemory } from '../config/memory';
import { buildWeatherAgentInstructions } from '../prompts/weather-prompts';
import { weatherTool } from '../tools/weather-tool';
import { scorers } from '../scorers/weather-scorer';

export const weatherAgent = new Agent({
  id: 'weather-agent',
  name: '天气助手',
  instructions: buildWeatherAgentInstructions(),
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
  memory: weatherAgentMemory,
});
