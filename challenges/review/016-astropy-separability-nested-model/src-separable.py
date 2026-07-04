# astropy/modeling/separable.py -- review context snapshot (excerpt).
# This is the code BEFORE the PR is applied.

import numpy as np


def _coord_matrix(model, pos, noutp):
    """
    Create a coordinate matrix for a simple model.
    """
    mat = np.zeros((noutp, model.n_inputs))
    if pos == "left":
        mat[: model.n_outputs, : model.n_inputs] = np.eye(model.n_outputs, model.n_inputs)
    else:
        mat[-model.n_outputs :, -model.n_inputs :] = np.eye(model.n_outputs, model.n_inputs)
    return mat


def _cstack(left, right):
    """
    Stack two separability matrices horizontally for the '&' operator.
    left and right may be simple models or nested CompoundModels whose
    matrices were already computed.
    """
    noutp = _compute_n_outputs(left, right)

    if isinstance(left, Model):
        cleft = _coord_matrix(left, "left", noutp)
    else:
        cleft = np.zeros((noutp, left.shape[1]))
        cleft[: left.shape[0], : left.shape[1]] = left

    if isinstance(right, Model):
        cright = _coord_matrix(right, "right", noutp)
    else:
        cright = np.zeros((noutp, right.shape[1]))
        cright[-right.shape[0] :, -right.shape[1] :] = right

    return np.hstack([cleft, cright])
