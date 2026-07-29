/** @format */

import fetch, { type RequestInit } from 'node-fetch';

export async function fetchAndJson(url: string, init?: RequestInit): Promise<unknown> {
  const fetched = await fetch(url, init);
  return await fetched.json();
}
