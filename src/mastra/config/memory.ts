import { Memory } from '@mastra/memory';

export const weatherAgentMemory = new Memory({
  id: 'weather-agent-memory',
  options: {
    lastMessages: 20,
  },
});
