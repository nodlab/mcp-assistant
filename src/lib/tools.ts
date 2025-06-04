import 'dotenv/config'
import { readFile } from 'fs/promises';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { TJSONTool, TTool } from '../types.js';

export async function getTools(): Promise<{ tools: TTool[] }> {
	const settingsPath = process.env.TOOLS_PATH as string;

  const data = await readFile(settingsPath, 'utf8');

	const { tools } = JSON.parse(data);

  return {
		tools: tools ? prepareToolsForRequestHandler(tools) : []
	};
}

export async function getToolByName(name: string): Promise<TJSONTool | undefined> {
	const settingsPath = process.env.TOOLS_PATH as string;

  const data = await readFile(settingsPath, 'utf8');

	const { tools } = JSON.parse(data);
	
	return tools.find((tool: TJSONTool) => tool.name === name);
}

function prepareToolsForRequestHandler(tools: TJSONTool[]): TTool[] {
	return tools.map((tool) => {
		return {
			name: tool.name,
			description: tool.description,
			inputSchema: zodToJsonSchema(z.object(tool.inputSchema)),
		};
	});
}