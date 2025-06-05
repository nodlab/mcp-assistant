import { readFile } from 'fs/promises';

export default async function loadFile(path: string) {
  try {
    return readFile(path, 'utf8');
  } catch (error) {
    // @ts-ignore
    console.error('File read error:', error.response?.data || error.message);
  }
}