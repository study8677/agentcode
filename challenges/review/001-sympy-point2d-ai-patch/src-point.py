# sympy/geometry/point.py -- review context snapshot (excerpt, unrelated
# methods omitted, docstring shortened). This is the code BEFORE the PR
# is applied.


class Point(GeometryEntity):
    """A point in a n-dimensional Euclidean space.

    Parameters
    ==========

    coords : sequence of n-coordinate values. In the special
        case where n=2 or 3, a Point2D or Point3D will be created
        as appropriate.
    evaluate : if `True` (default), all floats are turned into
        exact types.

    Raises
    ======

    TypeError
        When instantiating with anything but a Point or sequence.
    ValueError
        When instantiating with a sequence with length < 2, or when
        an explicitly imaginary coordinate such as Point(I, 2) is
        given (message: 'Imaginary coordinates are not permitted.').
    """

    def __new__(cls, *args, **kwargs):
        evaluate = kwargs.get('evaluate', global_parameters.evaluate)
        on_morph = kwargs.get('on_morph', 'ignore')

        # unpack into coords
        coords = args[0] if len(args) == 1 else args

        # check args and handle quickly handle Point instances
        if isinstance(coords, Point):
            # even if we're mutating the dimension of a point, we
            # don't reevaluate its coordinates
            evaluate = False
            if len(coords) == kwargs.get('dim', len(coords)):
                return coords

        if not is_sequence(coords):
            raise TypeError('Expecting sequence of coordinates, not `{}`'
                            .format(func_name(coords)))

        coords = Tuple(*coords)
        dim = kwargs.get('dim', len(coords))

        if len(coords) < 2:
            raise ValueError('Point requires 2 or more coordinates or '
                             'keyword `dim` > 1.')
        if len(coords) != dim:
            # dimension morphing according to on_morph
            # ('ignore', 'error' or 'warn') -- omitted here
            pass
        if any(coords[dim:]):
            raise ValueError('Nonzero coordinates cannot be removed.')
        if any(a.is_number and im(a) for a in coords):
            raise ValueError('Imaginary coordinates are not permitted.')
        if not all(isinstance(a, Expr) for a in coords):
            raise TypeError('Coordinates must be valid SymPy expressions.')

        # pad with zeros appropriately
        coords = coords[:dim] + (S.Zero,)*(dim - len(coords))

        # Turn any Floats into rationals and simplify
        # any expressions before we instantiate
        if evaluate:
            coords = coords.xreplace({
                f: simplify(nsimplify(f, rational=True))
                for f in coords.atoms(Float)})

        # return 2D or 3D instances
        if len(coords) == 2:
            kwargs['_nocheck'] = True
            return Point2D(*coords, **kwargs)
        elif len(coords) == 3:
            kwargs['_nocheck'] = True
            return Point3D(*coords, **kwargs)

        # the general Point
        return GeometryEntity.__new__(cls, *coords)
