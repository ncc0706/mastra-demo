
import { Mastra } from '@mastra/core/mastra';
import { MastraEditor } from '@mastra/editor';
import { PinoLogger } from '@mastra/loggers';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { createMastraStorage } from './config/storage';
import { weatherWorkflow } from './workflows/weather-workflow';
import { chatWorkflow } from './workflows/chat-workflow';
import { weatherAgent } from './agents/weather-agent';
import { chatAgent } from './agents/chat-agent';
import { wmsAnalyst } from './agents/analyst-agent';
import { toolCallAppropriatenessScorer, completenessScorer, weatherDetailScorer } from './scorers/weather-scorer';

const storage = await createMastraStorage();
await storage.init();

export const mastra = new Mastra({
  workflows: { weatherWorkflow, chatWorkflow },
  agents: { weatherAgent, chatAgent, wmsAnalyst },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, weatherDetailScorer },
  storage,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(),
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
  editor: new MastraEditor(),
});
