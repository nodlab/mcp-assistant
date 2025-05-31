import 'dotenv/config'
import fetch from "node-fetch";
import { base64ToUtf8 } from '../utils.js';
import { remark } from 'remark';

const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
const GITLAB_API_URL = process.env.GITLAB_API_URL;

async function parse () {
	const url = new URL(`${GITLAB_API_URL}/projects/254/repository/files/doc%2Fdevelopment%2Farchitecture.md?ref=main`);

	const response = await fetch(url.toString(), {
		headers: {
			"Authorization": `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
		}
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const responseData: any = await response.json();

	const contentDecoded = base64ToUtf8(responseData.content);

	const tree = await remark().parse(contentDecoded);

	console.dir(tree, { depth: 3 });

	return contentDecoded;
}

parse();