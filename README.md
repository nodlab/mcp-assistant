# Assistant MCP Server

### Development

After cloning the repository, run the command to install the dependencies:

```bash
yarn install
```

It is also necessary to add a tools.json file, example:

```json
{
	"tools": [
		{
			"name": "architecture_info",
			"description": "Obtaining mandatory information about the architecture of frontend application projects",
			"inputSchema": {},
			"plugin": {
				"type": "file",
				"args": {
					"path": "/path/to/folder/public/tasks.txt"
				}
			}
		},
		{
			"name": "search_tasks",
			"description": "Before executing this function, you must retrieve the project architecture information from 'architecture_info'. This is mandatory information and you must respect it. After that you need to find the task you are talking about, analyze what needs to be done and implement it in the project according to the architecture and requirements. You don't need to invent anything additional from yourself, just what is required",
			"inputSchema": {},
			"plugin": {
				"type": "file",
				"args": {
					"path": "/path/to/folder/public/architecture.md"
				}
			}
		}
	]
}
```

To build the project, you must execute the command:

```bash
yarn build
```

<details>
  <summary>Connecting to a local server</summary>  


	```json
	{
		"mcpServers": {
			"mcp-assistant-local": {
				"command": "npx",
				"args": ["tsx", "/path/to/folder/mcp-assistant/src/index.ts"],
				"env": {
					"TOOLS_PATH": "/path/to/folder/tools.json"
				}
			}
		}
	}
	```
</details>

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
