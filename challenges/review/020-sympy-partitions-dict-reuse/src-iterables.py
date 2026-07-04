# sympy/utilities/iterables.py -- review context snapshot (excerpt). This is
# the code BEFORE the PR is applied.


def partitions(n, m=None, k=None, size=False):
    """
    Generate all partitions of integer n.

    If size is False, yield a dictionary mapping part -> multiplicity.
    If size is True, yield (sum(multiplicities), dictionary).
    """
    ms = {n: 1}

    if size:
        yield sum(ms.values()), ms
    else:
        yield ms

    while True:
        # The real implementation mutates ms in place while walking to the
        # next partition. The mutation details are omitted here; the yield
        # contract is what matters for this review.
        if not _advance_partition_state(ms, n, m, k):
            return

        if size:
            yield sum(ms.values()), ms
        else:
            yield ms
