import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";



const step1 = createStep({
  id: 'step1',
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
  execute: async ({ inputData }) => {
    return { response: 'Hello, world!' };
  },
});


const chatWorkflow = createWorkflow({
  id: 'chat-workflow',
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
})
.then(step1);

chatWorkflow.commit()

export { chatWorkflow };
