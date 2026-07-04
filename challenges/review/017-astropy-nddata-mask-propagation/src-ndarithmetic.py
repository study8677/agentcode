# astropy/nddata/mixins/ndarithmetic.py -- review context snapshot (excerpt).
# This is the code BEFORE the PR is applied.

from copy import deepcopy


class NDArithmeticMixin:
    def _arithmetic_mask(self, operation, operand, handle_mask, **kwds):
        """
        Calculate the mask for arithmetic output.
        """
        if self.mask is None and (operand is None or operand.mask is None):
            return None

        elif self.mask is None:
            # There is no mask on self, so copy the operand mask.
            return deepcopy(operand.mask)

        elif operand is None:
            # There is no second operand, so preserve self's mask.
            return deepcopy(self.mask)

        elif operand.mask is None:
            # The second operand exists but has no mask.
            return deepcopy(self.mask)

        else:
            # Both operands have masks; delegate to the configured combiner.
            return handle_mask(self.mask, operand.mask, **kwds)
