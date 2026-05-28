import { z } from 'zod';
import { createToolCallAccuracyScorerCode } from '@mastra/evals/scorers/prebuilt';
import { createCompletenessScorer } from '@mastra/evals/scorers/prebuilt';
import { getAssistantMessageFromRunOutput, getUserMessageFromRunInput } from '@mastra/evals/scorers/utils';
import { createScorer } from '@mastra/core/evals';
import { models } from '../config/models';

export const toolCallAppropriatenessScorer = createToolCallAccuracyScorerCode({
  expectedTool: 'weatherTool',
  strictMode: false,
});

export const completenessScorer = createCompletenessScorer();

export const weatherDetailScorer = createScorer({
  id: 'weather-detail-scorer',
  name: '天气信息完整度',
  description:
    '检查助手是否正确处理城市名称，并在回复中包含 weatherTool 返回的关键天气字段（温度、体感温度、湿度、风速、天气状况、地点）',
  type: 'agent',
  judge: {
    model: models.scorerJudge,
    instructions:
      '你是天气助手回复质量评估专家。请根据用户输入和助手回复，判断地点处理是否正确，以及是否包含完整的天气信息。' +
      '和风天气支持中文及英文城市名，无需将中文地名翻译成英文。' +
      '仅返回符合 schema 的结构化 JSON。',
  },
})
  .preprocess(({ run }) => {
    const userText = getUserMessageFromRunInput(run.input) || '';
    const assistantText = getAssistantMessageFromRunOutput(run.output) || '';
    return { userText, assistantText };
  })
  .analyze({
    description: '评估地点处理与天气字段覆盖情况',
    outputSchema: z.object({
      needsWeatherQuery: z.boolean(),
      locationHandledCorrectly: z.boolean(),
      includesTemperature: z.boolean(),
      includesFeelsLike: z.boolean(),
      includesHumidity: z.boolean(),
      includesWindSpeed: z.boolean(),
      includesConditions: z.boolean(),
      confidence: z.number().min(0).max(1).default(1),
      explanation: z.string().default(''),
    }),
    createPrompt: ({ results }) => `
你是天气助手质量评估员。weatherTool 返回以下字段：
- temperature（温度，摄氏度）
- feelsLike（体感温度）
- humidity（相对湿度，百分比）
- windSpeed（风速，公里/小时）
- conditions（天气状况，中文描述）
- location（地点名称）

用户输入：
"""
${results.preprocessStepResult.userText}
"""

助手回复：
"""
${results.preprocessStepResult.assistantText}
"""

请评估：
1) needsWeatherQuery：用户是否在询问天气、气温、穿衣或活动等与天气相关的问题。
2) locationHandledCorrectly：若用户提供了地点，助手是否正确理解并使用了该地点（中文、英文、拼音均可；若未提供地点且助手展示 A/B/C/D 菜单或在追问，也算正确）。
3) includesTemperature / includesFeelsLike / includesHumidity / includesWindSpeed / includesConditions：助手回复是否包含对应信息（允许不同表述，如「25°C」「25度」「湿度 60%」）。

返回 JSON：
{
  "needsWeatherQuery": boolean,
  "locationHandledCorrectly": boolean,
  "includesTemperature": boolean,
  "includesFeelsLike": boolean,
  "includesHumidity": boolean,
  "includesWindSpeed": boolean,
  "includesConditions": boolean,
  "confidence": number,
  "explanation": string
}
`,
  })
  .generateScore(({ results }) => {
    const r = (results as { analyzeStepResult?: Record<string, unknown> })?.analyzeStepResult || {};
    if (!r.needsWeatherQuery) return 1;

    const fieldScores = [
      r.includesTemperature,
      r.includesFeelsLike,
      r.includesHumidity,
      r.includesWindSpeed,
      r.includesConditions,
    ].filter(Boolean).length;

    const detailScore = fieldScores / 5;
    const locationScore = r.locationHandledCorrectly ? 1 : 0;
    const confidence = typeof r.confidence === 'number' ? r.confidence : 1;

    return Math.max(0, Math.min(1, locationScore * 0.4 + detailScore * 0.6 * confidence));
  })
  .generateReason(({ results, score }) => {
    const r = (results as { analyzeStepResult?: Record<string, unknown> })?.analyzeStepResult || {};
    return (
      `天气信息评分：needsWeatherQuery=${r.needsWeatherQuery ?? false}，` +
      `locationHandledCorrectly=${r.locationHandledCorrectly ?? false}，` +
      `字段覆盖=${[
        r.includesTemperature && '温度',
        r.includesFeelsLike && '体感',
        r.includesHumidity && '湿度',
        r.includesWindSpeed && '风速',
        r.includesConditions && '状况',
      ]
        .filter(Boolean)
        .join('、') || '无'}，` +
      `score=${score}。${r.explanation ?? ''}`
    );
  });

export const scorers = {
  toolCallAppropriatenessScorer,
  completenessScorer,
  weatherDetailScorer,
};
