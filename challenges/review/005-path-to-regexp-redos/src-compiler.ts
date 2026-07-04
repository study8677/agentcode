// path-to-regexp route compiler -- review context snapshot (adapted &
// simplified excerpt; unrelated token types and options omitted).
// This is the code BEFORE the PR is applied.

export interface Token {
  // 'text' is a literal segment (e.g. the '-' between two params);
  // 'param' is a named parameter such as :a.
  type: 'text' | 'param'
  value: string        // literal text, or the parameter name
  prefix?: string      // delimiter emitted before this token, e.g. '/'
  suffix?: string      // separator emitted after this param, e.g. '-'
  pattern?: string     // custom capture, e.g. '\\d+' for /:id(\\d+)
}

// Default capture for a parameter: lazy, "anything but a slash".
const DEFAULT_PATTERN = '[^/]+?'

function escapeString(str: string): string {
  return str.replace(/[.+*?=^!:${}()[\]|/\\]/g, '\\$&')
}

// Turn a single token into its regexp fragment. `next` is the following
// token, if any.
function tokenToRegExp(token: Token, next?: Token): string {
  if (token.type !== 'param') return escapeString(token.value)

  const capture = token.pattern || DEFAULT_PATTERN
  return '(' + capture + ')'
}

// Compile a token stream into an anchored RegExp. Between two adjacent
// params the parser stores the separator on the earlier param's `suffix`
// (e.g. '/:a-:b' -> [param a (suffix '-'), param b]).
export function tokensToRegExp(tokens: Token[]): RegExp {
  let route = '^'
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.prefix) route += escapeString(token.prefix)
    route += tokenToRegExp(token, tokens[i + 1])
    if (token.suffix) route += escapeString(token.suffix)
  }
  route += '$'
  return new RegExp(route)
}

// Example compilations (pre-PR):
//   '/:a-:b'        -> /^\/([^/]+?)-([^/]+?)$/
//   '/:a.:b'        -> /^\/([^/]+?)\.([^/]+?)$/
//   '/:a-:b-:c'     -> /^\/([^/]+?)-([^/]+?)-([^/]+?)$/
//   '/:id(\\d+)-:x' -> /^\/(\d+)-([^/]+?)$/
