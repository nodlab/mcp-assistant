#!/usr/bin/env node
import 'dotenv/config'

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { getToolByName, getTools } from './lib/tools.js';
import loadFile from './lib/plugins/file.plugin.js';

const server = new Server({
  name: "assistant-mcp-server",
  version: "0.0.1",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => await getTools());

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    const tool = await getToolByName(request.params.name);

    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await loadFile(tool.plugin.args.path), null, 2)
        }
      ]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod error:', error);
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Assistant MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});