/**
 * Mastra model router 模型 ID 集中配置。
 * 格式：`provider/model-name`，详见 https://mastra.ai/models
 */
const NVIDIA_LLAMA_3_3_70B_INSTRUCT = 'nvidia/meta/llama-3.3-70b-instruct' as const;

export const models = {
  weatherAgent: NVIDIA_LLAMA_3_3_70B_INSTRUCT,
  chatAgent: NVIDIA_LLAMA_3_3_70B_INSTRUCT,
  scorerJudge: NVIDIA_LLAMA_3_3_70B_INSTRUCT,
} as const;

export type ModelId = (typeof models)[keyof typeof models];
