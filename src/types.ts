export type TJSONTool = {
	name: string;
	description: string;
	inputSchema: any;
	plugin: {
		type: string;
		args: {
			[key: string]: string;
		};
	}
}

export type TTool = {
	name: string;
	description: string;
	inputSchema: any;
}