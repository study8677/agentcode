# requests/adapters.py -- review context snapshot (excerpt). This is the code
# BEFORE the PR is applied.

from .exceptions import ConnectionError, ConnectTimeout, ProxyError, ReadTimeout, SSLError
from .packages.urllib3.exceptions import (
    ConnectTimeoutError,
    MaxRetryError,
    NewConnectionError,
    ProtocolError,
    ReadTimeoutError,
    ResponseError,
    SSLError as _SSLError,
)
from .packages.urllib3.exceptions import ProxyError as _ProxyError

# urllib3 exception hierarchy excerpt needed for this review:
#
#     HTTPError
#       PoolError
#         ClosedPoolError
#
# ClosedPoolError is a PoolError. It is not a ProtocolError, OSError,
# MaxRetryError, _ProxyError, _SSLError, or ReadTimeoutError, so the except
# branches below do not currently translate it into a Requests exception.


class HTTPAdapter:
    def send(self, request, stream=False, timeout=None, verify=True, cert=None, proxies=None):
        """
        Send a PreparedRequest and translate lower-level urllib3 failures into
        Requests exceptions before returning to callers.
        """
        try:
            resp = self.poolmanager.urlopen(
                method=request.method,
                url=request.url,
                body=request.body,
                headers=request.headers,
                retries=self.max_retries,
                redirect=False,
                assert_same_host=False,
                preload_content=False,
                decode_content=False,
                timeout=timeout,
            )
        except (ProtocolError, OSError) as err:
            raise ConnectionError(err, request=request)
        except MaxRetryError as e:
            if isinstance(e.reason, ConnectTimeoutError):
                raise ConnectTimeout(e, request=request)
            if isinstance(e.reason, ResponseError):
                raise RetryError(e, request=request)
            if isinstance(e.reason, _ProxyError):
                raise ProxyError(e, request=request)
            if isinstance(e.reason, _SSLError):
                raise SSLError(e, request=request)
            raise ConnectionError(e, request=request)
        except _ProxyError as e:
            raise ProxyError(e, request=request)
        except (_SSLError) as e:
            raise SSLError(e, request=request)
        except ReadTimeoutError as e:
            raise ReadTimeout(e, request=request)

        return self.build_response(request, resp)
