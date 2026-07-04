# django/contrib/admin/utils.py -- review context snapshot (excerpt, unrelated
# helpers omitted). This is the code BEFORE the PR is applied.


def display_for_field(value, field, empty_value_display):
    from django.contrib.admin.templatetags.admin_list import _boolean_icon

    if getattr(field, 'flatchoices', None):
        return dict(field.flatchoices).get(value, empty_value_display)
    # BooleanField needs special-case null-handling, so it comes before the
    # general null test.
    elif isinstance(field, models.BooleanField):
        return _boolean_icon(value)
    elif value is None:
        return empty_value_display
    elif isinstance(field, models.DateTimeField):
        return formats.localize(timezone.template_localtime(value))
    elif isinstance(field, (models.DateField, models.TimeField)):
        return formats.localize(value)
    elif isinstance(field, models.DecimalField):
        return formats.number_format(value, field.decimal_places)
    elif isinstance(field, (models.IntegerField, models.FloatField)):
        return formats.number_format(value)
    elif isinstance(field, models.FileField) and value:
        return format_html('<a href="{}">{}</a>', value.url, value)
    else:
        return display_for_value(value, empty_value_display)


def display_for_value(value, empty_value_display, boolean=False):
    from django.contrib.admin.templatetags.admin_list import _boolean_icon

    if boolean:
        return _boolean_icon(value)
    elif value is None:
        return empty_value_display
    elif isinstance(value, bool):
        return str(value)
    elif isinstance(value, datetime.datetime):
        return formats.localize(timezone.template_localtime(value))
    elif isinstance(value, (datetime.date, datetime.time)):
        return formats.localize(value)
    elif isinstance(value, (int, decimal.Decimal, float)):
        return formats.number_format(value)
    elif isinstance(value, (list, tuple)):
        return ', '.join(str(v) for v in value)
    else:
        return str(value)


# ---------------------------------------------------------------------------
# django/db/models/fields/json.py -- JSONField (excerpt), NOT touched by the
# PR. Shown here because the patch calls field.get_prep_value().
# ---------------------------------------------------------------------------


class JSONField(CheckFieldDefaultMixin, Field):
    empty_strings_allowed = False
    description = _('A JSON object')
    default_error_messages = {
        'invalid': _('Value must be valid JSON.'),
    }

    def __init__(self, verbose_name=None, name=None, encoder=None,
                 decoder=None, **kwargs):
        if encoder and not callable(encoder):
            raise ValueError('The encoder parameter must be a callable object.')
        if decoder and not callable(decoder):
            raise ValueError('The decoder parameter must be a callable object.')
        self.encoder = encoder
        self.decoder = decoder
        super().__init__(verbose_name, name, **kwargs)

    def get_prep_value(self, value):
        if value is None:
            return value
        return json.dumps(value, cls=self.encoder)
