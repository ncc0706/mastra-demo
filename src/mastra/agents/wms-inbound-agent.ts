import { Agent } from "@mastra/core/agent";
import { models } from "../config/models";


export const wmsInboundAgent = new Agent({
  id: 'wms-inbound-agent',
  name: 'WMS 入库专家',
  description: "仓储入库专家。负责调研和解答关于 WMS 中收货、质检、上架（Putaway）等入库环节的功能需求。",
  model: models.chatAgent,
  instructions: `你是一位资深的 WMS 入库流程专家。
当用户询问关于仓储入库、收货、质检、上架等问题时，请提供详尽的行业最佳实践和功能清单。
你的回答应当专业、条理清晰，便于后续整理成需求文档。`
})