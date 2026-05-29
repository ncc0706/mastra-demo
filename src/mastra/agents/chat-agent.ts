import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { models } from '../config/models';

export const chatAgent = new Agent({
  id: 'chat-agent',
  name: '聊天助手',
  instructions: '你是一个聊天助手，可以回答用户的问题和帮助用户完成任务。',
  model: models.chatAgent,
  tools: {  },
  memory: new Memory({
    options: {
      lastMessages: 10,
    },
  }),
});