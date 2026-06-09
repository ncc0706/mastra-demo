import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export const weatherAgentMemory = new Memory({
  storage: new LibSQLStore({
    id: 'weather-agent-memory-storage',
    url: 'file:./weather-agent-memory.db',
  }),
  options: {
    lastMessages: 20,
  },
});
