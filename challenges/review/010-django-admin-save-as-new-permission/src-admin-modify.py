# django/contrib/admin/templatetags/admin_modify.py -- review context snapshot
# (excerpt). This is the code BEFORE the PR is applied.

from django.template import Library

register = Library()


@register.inclusion_tag("admin/submit_line.html", takes_context=True)
def submit_row(context):
    """
    Display the row of buttons for delete and save.
    """
    add = context["add"]
    change = context["change"]
    is_popup = context["is_popup"]
    save_as = context["save_as"]
    show_save = context.get("show_save", True)
    has_add_permission = context["has_add_permission"]
    has_change_permission = context["has_change_permission"]
    has_view_permission = context["has_view_permission"]
    has_editable_inline_admin_formsets = context["has_editable_inline_admin_formsets"]

    can_save = (
        (has_change_permission and change)
        or (has_add_permission and add)
        or has_editable_inline_admin_formsets
    )
    can_save_and_add_another = (
        has_add_permission
        and not is_popup
        and (not save_as or add)
    )
    can_save_and_continue = (
        not is_popup
        and can_save
        and has_view_permission
    )

    return {
        "show_delete_link": context["show_delete"] and change and not is_popup,
        "show_save_as_new": (
            not is_popup
            and has_add_permission
            and has_change_permission
            and change
            and save_as
        ),
        "show_save_and_add_another": can_save_and_add_another,
        "show_save_and_continue": can_save_and_continue,
        "show_save": show_save and can_save,
    }
