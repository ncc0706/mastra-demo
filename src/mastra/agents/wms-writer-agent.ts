import { Agent } from "@mastra/core/agent";
import { models } from "../config/models";


export const wmsWriterAgent = new Agent({
  id: 'wms-writer-agent',
  name: 'WMS 文档分析师',
  description: "文档撰写专家。负责将前序的调研结果和用户的补充要求，整合成一份完整的 WMS 功能需求规格说明书。",
  model: models.chatAgent,
  instructions: `你是一位专业的系统分析师。
接收前面专家提供的 WMS 功能点，结合用户的需求，生成一份 Markdown 格式的 WMS 需求文档。
包含：背景、核心功能模块、业务流程图（用文字描述）、非功能性需求等。`
})