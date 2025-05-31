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
import {
  GitLabSearchResponseSchema,
  SearchRepositoriesSchema,
  type GitLabSearchResponse,
  GetMyAsanaTasksSchema,
  SearchTasksSchema,
  ArchitectureInfo,
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

async function searchGitLabProjects(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<GitLabSearchResponse> {
  const url = new URL(`${GITLAB_API_URL}/projects`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const projects = await response.json();
  return GitLabSearchResponseSchema.parse({
    count: parseInt(response.headers.get("X-Total") || "0"),
    items: projects
  });
}

async function getAsanaMe () {
  const urlMe = new URL(`${ASANA_API_URL}/users/me`);
  const responseMe = await fetch(urlMe.toString(), {
    method: 'GET',
    headers: {
      "Authorization": `Bearer ${ASANA_ACCESS_TOKEN}`
    }
  });
  // @ts-ignore
  const { data } = await responseMe.json();

  return data;
}

async function searchMyTasks(user_gid: string, user_workspace_gid: string) {
  try {
    const asanaUrl = new URL(`${ASANA_API_URL}/tasks`);
    asanaUrl.searchParams.append("assignee", user_gid);
    asanaUrl.searchParams.append("workspace", user_workspace_gid);
    asanaUrl.searchParams.append("completed_since", 'now');
    asanaUrl.searchParams.append("opt_fields", 'name,completed,due_on,projects.name,notes');

    const asanaTasks = await fetch(asanaUrl.toString(), {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${ASANA_ACCESS_TOKEN}`
      }
    });

    // @ts-ignore
    const { data: tasks } = await asanaTasks.json();

    for (const task of tasks) {
      const storiesUrl = new URL(`${ASANA_API_URL}/tasks/${task.gid}/stories`);
      storiesUrl.searchParams.append("opt_fields", 'type,text,created_at,created_by.name');
      const storiesRequest = await fetch(storiesUrl.toString(), {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${ASANA_ACCESS_TOKEN}`
        }
      });
      // @ts-ignore
      const response = await storiesRequest.json();
      // @ts-ignore
      console.log('taskHistory!!:', response.data);
      // @ts-ignore
      task.taskHistory = response.data;
    }

    return tasks;
  } catch (error) {
    // @ts-ignore
    console.error('Ошибка при получении задач:', error.response?.data || error.message);
  }
}

async function searchAsanaTasks(query: string, user_workspace_gid: string) {
  try {
    const url = new URL(`${ASANA_API_URL}/workspaces/${user_workspace_gid}/tasks/search`);
    url.searchParams.append("text", query);

    const asanaTasks = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${ASANA_ACCESS_TOKEN}`
      }
    });

    // @ts-ignore
    const { data } = await asanaTasks.json();
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
        name: "search_repositories",
        description: "Search for GitLab projects",
        inputSchema: zodToJsonSchema(SearchRepositoriesSchema)
      },
      {
        name: "get_info_about_me",
        description: "Get info about me into Asans",
        inputSchema: zodToJsonSchema(SearchTasksSchema)
      },
      {
        name: "search_my_tasks",
        description: "Search my Asans tasks",
        inputSchema: zodToJsonSchema(GetMyAsanaTasksSchema)
      },
      {
        name: "search_tasks",
        description: "Search Asans tasks",
        inputSchema: zodToJsonSchema(SearchTasksSchema)
      },
      {
        name: "architecture_info",
        description: `You should prepare a summary and only the most important points that are described in the architecture. `,
        inputSchema: zodToJsonSchema(ArchitectureInfo)
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
      case "search_repositories": {
        const args = SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await searchGitLabProjects(args.search, args.page, args.per_page);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "get_info_about_me": {
        const results = await getAsanaMe();
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "search_my_tasks": {
        const args = GetMyAsanaTasksSchema.parse(request.params.arguments);
        const results = await searchMyTasks(args.user_gid, args.user_workspace_gid);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "search_tasks": {
        const args = SearchTasksSchema.parse(request.params.arguments);
        const results = await searchAsanaTasks(args.search, args.user_workspace_gid);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
      case "architecture_info": {
        // const args = ArchitectureInfo.parse(request.params.arguments);
        const results = await getArchitectureInfo();
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
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