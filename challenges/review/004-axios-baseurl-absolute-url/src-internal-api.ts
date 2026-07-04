// src/internal-api.ts -- review context snapshot (excerpt).
// This is the code BEFORE the PR is applied.

import axios from 'axios'

// Internal service client. baseURL points at an internal host and the
// default Authorization header is attached to every request this client
// makes. Per Axios URL rules, an absolute URL passed as the request path
// overrides baseURL and is sent to that URL's own origin.
export const internalApi = axios.create({
  baseURL: process.env.INTERNAL_API_URL, // e.g. https://internal.svc.local
  headers: { Authorization: 'Bearer ' + process.env.INTERNAL_API_TOKEN },
})

// Callers pass a path that is appended to baseURL.
export async function fetchInternal(path: string) {
  const response = await internalApi.get(path)
  return response.data
}
