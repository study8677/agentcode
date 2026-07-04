// app/actions/redirect.ts -- review context snapshot (excerpt).
// This is the code BEFORE the PR is applied.

'use server'

import { headers } from 'next/headers'

const APP_ORIGIN = process.env.APP_ORIGIN ?? 'https://app.example.com'

// Resolve the redirect target against the trusted app origin, then fetch
// the page on the server so the action can return its rendered contents.
export async function followActionRedirect(redirectUrl: string) {
  // Relative paths resolve against APP_ORIGIN; absolute URLs keep their own
  // origin and are rejected below.
  const target = new URL(redirectUrl, APP_ORIGIN)

  if (target.origin !== APP_ORIGIN) {
    throw new Error('cross-origin redirect is not allowed')
  }

  const response = await fetch(target, { headers: { 'rsc-action': '1' } })
  return response.text()
}
