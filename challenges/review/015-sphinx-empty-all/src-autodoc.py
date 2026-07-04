# sphinx/ext/autodoc/__init__.py and sphinx/util/inspect.py -- review context
# snapshot (excerpts, unrelated documenters and helpers omitted). This is the
# code BEFORE the PR is applied.


# ---------------------------------------------------------------------------
# sphinx/util/inspect.py
# ---------------------------------------------------------------------------

def getall(obj: Any) -> Optional[Sequence[str]]:
    """Get the __all__ attribute of an object as a sequence.

    Returns None when the object does not define __all__.  Raises ValueError
    when __all__ is defined but is not a list/tuple of strings.
    """
    __all__ = safe_getattr(obj, '__all__', None)
    if __all__ is None:
        return None
    else:
        if (isinstance(__all__, (list, tuple)) and
                all(isinstance(e, str) for e in __all__)):
            return __all__
        else:
            raise ValueError(__all__)


# ---------------------------------------------------------------------------
# sphinx/ext/autodoc/__init__.py
# ---------------------------------------------------------------------------

class ModuleDocumenter(Documenter):
    """Specialized Documenter subclass for modules."""
    objtype = 'module'
    content_indent = ''

    def __init__(self, *args: Any) -> None:
        super().__init__(*args)
        merge_members_option(self.options)
        self.__all__ = None  # type: Optional[Sequence[str]]

    def import_object(self, raiseerror: bool = False) -> bool:
        ret = super().import_object(raiseerror)

        try:
            if not self.options.ignore_module_all:
                self.__all__ = inspect.getall(self.object)
        except ValueError as exc:
            # invalid __all__ found.
            logger.warning(__('__all__ should be a list of strings, not %r '
                              '(in module %s) -- ignoring __all__') %
                           (exc.args[0], self.fullname), type='autodoc')

        return ret

    def get_module_members(self) -> Dict[str, ObjectMember]:
        """Get members of target module."""
        # Collects every attribute of the module (including annotation-only
        # members) into a name -> ObjectMember mapping.  Body omitted.
        ...

    def get_object_members(self, want_all: bool) -> Tuple[bool, ObjectMembers]:
        members = self.get_module_members()
        if want_all:
            if not self.__all__:
                # for implicit module members, check __module__ to avoid
                # documenting imported objects
                return True, list(members.values())
            else:
                for member in members.values():
                    if member.__name__ not in self.__all__:
                        # skip members not in __all__
                        member.skipped = True

                return False, list(members.values())
        else:
            memberlist = self.options.members or []
            ret = []
            for name in memberlist:
                if name in members:
                    ret.append(members[name])
                else:
                    logger.warning(__('missing attribute mentioned in :members: '
                                      'option: module %s, attribute %s') %
                                   (safe_getattr(self.object, '__name__', '???'),
                                    name), type='autodoc')
            return False, ret


# For reference: how skipped members are handled later in the pipeline
# (from Documenter.filter_members, same file):
#
#     elif want_all and isinstance(obj, ObjectMember) and obj.skipped:
#         # forcedly skipped member (ex. a module attribute not defined
#         # in __all__)
#         keep = False
