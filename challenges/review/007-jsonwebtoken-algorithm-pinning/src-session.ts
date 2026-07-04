// src/auth/session.ts -- review context snapshot (excerpt, unrelated
// helpers omitted). This is the code BEFORE the PR is applied.

import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import type { Request, Response, NextFunction } from 'express'

// RS256 public key shipped to the service via config. Tokens are signed by
// the auth service's private key and verified here with the public key.
const publicKey = readFileSync(process.env.JWT_PUBLIC_KEY_PATH!, 'utf8')

export function verifySession(token: string) {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'agentcode.codes',
    audience: 'agentcode-web',
  })
}

// Express middleware that guards protected routes.
export function requireSession(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  try {
    const payload = verifySession(token)
    ;(req as any).user = payload
    next()
  } catch (err) {
    res.status(401).json({ error: 'invalid session' })
  }
}
