#!/usr/bin/env node
import 'dotenv/config'

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fs from 'fs';
import {
  ArchitectureInfo,
  TasksInfo,
  TaskSolution,
} from './schemas.js';
import { base64ToUtf8 } from "./src/utils.js";

const server = new Server({
  name: "assistant-mcp-server",
  version: "0.0.1",
}, {
  capabilities: {
    tools: {}
  }
});

const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
const GITLAB_API_URL = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
const ASANA_API_URL = process.env.ASANA_API_URL;
const ASANA_ACCESS_TOKEN = process.env.ASANA_ACCESS_TOKEN;

if (!GITLAB_PERSONAL_ACCESS_TOKEN) {
  console.error("GITLAB_PERSONAL_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

if (!ASANA_ACCESS_TOKEN) {
  console.error("ASANA_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

async function searchTask() {
  try {
    const data = fs.readFileSync('./public/asana.txt', 'utf8');

    return data;
  } catch (error) {
    // @ts-ignore
    console.error('Ошибка при получении задач:', error.response?.data || error.message);
  }
}

async function getArchitectureInfo () {
  // it's temporary url, only for test
  const url = new URL(`${GITLAB_API_URL}/projects/254/repository/files/doc%2Fdevelopment%2Farchitecture.md?ref=main`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: any = await response.json();

    const projectInfoFileDecode = base64ToUtf8(responseData.content);

    return projectInfoFileDecode;
  } catch (error) {
    console.error('Ошибка при загрузке файла:');
  }

}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "architecture_info",
        description: `You should prepare a summary and only the most important points that are described in the architecture. `,
        inputSchema: zodToJsonSchema(ArchitectureInfo)
      },
      {
        name: "search_tasks",
        description: `You must call this function before 'task_solution' to get complete information about tasks in projects. 
        You have to find the task the user is talking about and put together a work plan`,
        inputSchema: zodToJsonSchema(TasksInfo)
      },
      {
        name: "task_solution",
        description: `
        You have to get information about active tasks from 'tasks_info', find the task the user is talking about.
        You should also get information about project rules, architecture and other rules in 'architecture_info'.
        After that you should analyze what should be done in the task and implement in the project taking into account code-style, architecture and other development rules.
        `,
        inputSchema: zodToJsonSchema(TaskSolution)
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "search_tasks": {
        // const args = SearchTasksSchema.parse(request.params.arguments);
        const results = await searchTask();
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "architecture_info": {
        // const args = ArchitectureInfo.parse(request.params.arguments);
        const results = await getArchitectureInfo();
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "task_solution": {
        // const args = TasksInfo.parse(request.params.arguments);
        // const results = await getArchitectureInfo();
        // return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
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
  console.error("GitLab MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});