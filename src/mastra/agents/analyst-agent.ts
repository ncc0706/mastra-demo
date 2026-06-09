// ./agents/wms-analyst-agent.ts
import { Agent } from '@mastra/core/agent';
import { models } from '../config/models';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { wmsInboundAgent } from './wms-inbound-agent';
import { wmsOutboundAgent } from './wms-outbound-agent';
import { wmsWriterAgent } from './wms-writer-agent';
import { weatherAgent } from './weather-agent';

export const wmsAnalyst = new Agent({
    id: 'wms-analyst',
    name: 'WMS 需求分析师',
    model: models.chatAgent, // Supervisor 建议使用能力更强的模型
    // 1. 配置 Memory 以实现“交互式完善”
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'memory-storage',
            url: 'file:./mastra.db'
        }
        ),
        options: {
            lastMessages: 20, // 记住最近 20 条对话，保证上下文连贯
            workingMemory: {
                enabled: true,
            }
        }
    }),
    // 2. 挂载子 Agent，Supervisor 会自动获得调用它们的能力
    agents: { wmsInboundAgent, wmsOutboundAgent, wmsWriterAgent, weatherAgent },
    instructions: `
你是一位经验丰富的 WMS（仓储管理系统）产品经理，擅长通过对话引导客户梳理业务需求。

## 你的工作流程：
1. **破冰与背景了解**：首先询问用户要管理的仓库类型和目前遇到的核心痛点。
2. **功能调研与拆解**：根据用户的描述，判断涉及哪些 WMS 模块（如入库、出库、库存盘点等）。
   - 如果需要入库相关的专业知识，委托给 \`  id: 'wms-inbound-agent',\` 获取详细功能点。
   - 如果需要出库相关的知识，委托给 \`wms-outbound-agent\`。
3. **交互式完善**：获取到初步信息后，**主动向用户反问确认**。例如：“您刚才提到需要效期管理，请问是按先进先出（FIFO）还是效期最早先出（FEFO）？”
4. **生成文档**：当用户表示需求已经梳理得差不多时，委托给 \`wms-writer-agent\` 生成最终的需求文档。

## 规则：
- 始终保持专业、耐心的顾问形象。
- 利用 Working Memory 随时记录用户透露的项目背景和已确认需求。
- 每次只聚焦于 1-2 个业务点进行深入挖掘，避免一次性抛出太多问题让用户感到压力。`,
});