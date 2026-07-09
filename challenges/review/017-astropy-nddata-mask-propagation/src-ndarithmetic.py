# astropy/nddata/mixins/ndarithmetic.py -- review context snapshot (excerpt).
# This is the code BEFORE the PR is applied. Unrelated methods omitted.
#
# _arithmetic_mask computes mask propagation for arithmetic operations. The
# caller passes the other value as `operand`; review the branches below to see
# which state each None check represents.

from copy import deepcopy


class NDArithmeticMixin:
    def _arithmetic_mask(self, operation, operand, handle_mask, **kwds):
        """Calculate the resulting mask for an arithmetic operation."""
        if handle_mask is None:
            return None

        # Neither operand carries a mask -> the result has no mask.
        if self.mask is None and operand.mask is None:
            return None

        # Only self has no mask -> take the operand's mask.
        elif self.mask is None:
            return deepcopy(operand.mask)

        # The other side contributes no mask -> keep self's mask.
        elif operand.mask is None:
            return deepcopy(self.mask)

        # Both operands carry a mask -> combine them.
        else:
            return handle_mask(self.mask, operand.mask, **kwds)
