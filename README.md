# Assistant MCP Server

### Development

After cloning the repository, run the command to install the dependencies:

```bash
yarn install
```

To build the project, you must execute the command:

```bash
yarn build
```

<details>
  <summary>Connecting to a local server</summary>

	> We recommend specifying the *-local suffix if you are also using the npm package @nodlab/mcp-assistant

	```json
	{
		"mcpServers": {
			"mcp-assistant-local": {
				"command": "npx",
				"args": ["tsx", "/path/to/folder/mcp-assistant/src/index.ts"],
				"env": {}
			}
		}
	}
	```
</details>

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
