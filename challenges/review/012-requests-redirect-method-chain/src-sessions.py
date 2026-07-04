# requests/sessions.py -- review context snapshot (excerpt, unrelated
# methods omitted). This is the code BEFORE the PR is applied.


class SessionRedirectMixin(object):

    def resolve_redirects(self, resp, req, stream=False, timeout=None,
                          verify=True, cert=None, proxies=None):
        """Receives a Response. Returns a generator of Responses."""

        i = 0

        while resp.is_redirect:
            prepared_request = req.copy()

            resp.content  # Consume socket so it can be released

            if i >= self.max_redirects:
                raise TooManyRedirects('Exceeded %s redirects.'
                                       % self.max_redirects)

            resp.close()

            url = resp.headers['location']
            method = req.method

            # Handle redirection without scheme (see: RFC 1808 Section 4)
            if url.startswith('//'):
                parsed_rurl = urlparse(resp.url)
                url = '%s:%s' % (parsed_rurl.scheme, url)

            # Facilitate relative 'location' headers, as allowed by RFC 7231.
            if not urlparse(url).netloc:
                url = urljoin(resp.url, requote_uri(url))
            else:
                url = requote_uri(url)

            prepared_request.url = url

            # http://tools.ietf.org/html/rfc7231#section-6.4.4
            if resp.status_code == codes.see_other and method != 'HEAD':
                method = 'GET'

            # Do what the browsers do, despite standards...
            if resp.status_code in (codes.moved, codes.found) and \
                    method not in ('GET', 'HEAD'):
                method = 'GET'

            prepared_request.method = method

            # https://github.com/kennethreitz/requests/issues/1084
            if resp.status_code not in (codes.temporary_redirect,
                                        codes.permanent_redirect):
                if 'Content-Length' in prepared_request.headers:
                    del prepared_request.headers['Content-Length']
                prepared_request.body = None

            extract_cookies_to_jar(prepared_request._cookies,
                                   prepared_request, resp.raw)
            prepared_request.prepare_cookies(prepared_request._cookies)

            resp = self.send(
                prepared_request,
                stream=stream,
                timeout=timeout,
                verify=verify,
                cert=cert,
                proxies=proxies,
                allow_redirects=False,
            )

            extract_cookies_to_jar(self.cookies, prepared_request, resp.raw)

            # Persist the per-hop request so the next hop starts from the
            # request we actually sent (method/body may differ from the
            # caller's original request after e.g. a 303).
            req = prepared_request

            i += 1
            yield resp
