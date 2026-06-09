import { Agent } from "@mastra/core/agent";
import { models } from "../config/models";


export const wmsOutboundAgent = new Agent({
  id: 'wms-outbound-agent',
  name: 'WMS 出库专家',
  description: "仓储出库专家。负责调研和解答关于 WMS 中波次拣货、分拣、复核、装车等出库环节的功能需求。",
  model: models.chatAgent,
  instructions: `你是一位资深的 WMS 出库流程专家。
专注于波次策略、拣货路径优化、分拣规则等业务。提供结构化的功能点描述。`
})