// lib/memstore.js -- review context snapshot (excerpt, unrelated methods
// omitted). This is the code BEFORE the PR is applied.

'use strict'
const { Store } = require('./store')
const { permuteDomain } = require('./permuteDomain')
const { pathMatch } = require('./pathMatch')

function MemoryCookieStore() {
  Store.call(this)
  this.synchronous = true
  // Three-level index: domain -> path -> key. A plain object at every layer.
  this.idx = {}
}

MemoryCookieStore.prototype = Object.create(Store.prototype)

MemoryCookieStore.prototype.findCookie = function (domain, path, key, cb) {
  if (!this.idx[domain]) return cb(null, undefined)
  if (!this.idx[domain][path]) return cb(null, undefined)
  return cb(null, this.idx[domain][path][key] || null)
}

MemoryCookieStore.prototype.findCookies = function (domain, path, cb) {
  const results = []
  if (!domain) return cb(null, [])

  const idx = this.idx
  for (const curDomain of permuteDomain(domain) || [domain]) {
    const domainIndex = idx[curDomain]
    if (!domainIndex) continue
    for (const curPath in domainIndex) {
      if (pathMatch(path, curPath)) {
        for (const key in domainIndex[curPath]) {
          results.push(domainIndex[curPath][key])
        }
      }
    }
  }
  cb(null, results)
}

MemoryCookieStore.prototype.putCookie = function (cookie, cb) {
  if (!this.idx[cookie.domain]) this.idx[cookie.domain] = {}
  if (!this.idx[cookie.domain][cookie.path]) this.idx[cookie.domain][cookie.path] = {}
  this.idx[cookie.domain][cookie.path][cookie.key] = cookie
  cb(null)
}

MemoryCookieStore.prototype.updateCookie = function (oldCookie, newCookie, cb) {
  this.putCookie(newCookie, cb)
}

MemoryCookieStore.prototype.removeCookie = function (domain, path, key, cb) {
  if (this.idx[domain] && this.idx[domain][path] && this.idx[domain][path][key]) {
    delete this.idx[domain][path][key]
  }
  cb(null)
}

exports.MemoryCookieStore = MemoryCookieStore
