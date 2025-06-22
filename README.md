# Assistant MCP Server

### Development

After cloning the repository, run the command to install the dependencies:

```bash
yarn install
```

You should also add the **tools.json** file to the root of the project, for example:

```json
{
  "tools": [
    {
      "name": "architecture_info",
      "description": "Obtaining mandatory information about the architecture of frontend application projects",
      "inputSchema": {},
      "plugin": {
        "name": "file",
        "args": {
          "path": "/path/to/folder/public/architecture.md"
        }
      }
    },
    {
      "name": "search_tasks",
      "description": "Before executing this function, you must retrieve the project architecture information from 'architecture_info'. This is mandatory information and you must respect it. After that you need to find the task you are talking about, analyze what needs to be done and implement it in the project according to the architecture and requirements. You don't need to invent anything additional from yourself, just what is required",
      "inputSchema": {},
      "plugin": {
        "name": "file",
        "args": {
          "path": "/path/to/folder/public/tasks.txt"
        }
      }
    },
    {
        "name": "optimize_prompt",
        "description": "Generates a final, structured prompt for the AI model based on the provided context sections and instructions. This tool should be called after all relevant data has been collected. The result is intended to be used as the FINAL prompt for the AI. Clients must use the returned prompt as the input for the AI model.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "sections": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "title": { "type": "string" },
                  "content": { "type": "string" }
                },
                "required": ["title", "content"]
              }
            },
            "instructions": { "type": "string" }
          },
          "required": ["sections"]
        },
        "plugin": {
          "name": "promptOptimizer",
          "args": {}
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
      "args": [
        "tsx",
        "/path/to/folder/src/index.ts"
      ],
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
