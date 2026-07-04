# xarray/core/variable.py -- review context snapshot (excerpt). This is the
# code BEFORE the PR is applied.

import numpy as np


def as_variable(obj, name=None, auto_convert=True):
    """
    Convert an object into an xarray Variable.
    """
    from xarray.core.dataarray import DataArray

    if isinstance(obj, Variable):
        obj = obj.copy(deep=False)

    elif isinstance(obj, tuple):
        try:
            obj = Variable(*obj)
        except (TypeError, ValueError) as error:
            if isinstance(obj[1], DataArray):
                raise TypeError(
                    "Variable %r: Using a DataArray object to construct a "
                    "variable is ambiguous, please extract the data using "
                    "the .data property." % name
                ) from error
            raise

    elif isinstance(obj, DataArray):
        obj = obj.variable

    elif isinstance(obj, np.ndarray):
        obj = Variable(("dim_0",), obj)

    return obj
