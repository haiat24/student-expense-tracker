from decimal import Decimal, InvalidOperation, localcontext


CENT = Decimal("0.01")
MAX_AMOUNT = Decimal("9999999999.99")


class InvalidMoney(ValueError):
    """Raised when a value cannot be stored exactly in Numeric(12, 2)."""


def parse_money(value):
    if isinstance(value, bool) or value is None:
        raise InvalidMoney
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise InvalidMoney from None

    if not amount.is_finite() or amount <= 0 or amount > MAX_AMOUNT:
        raise InvalidMoney

    # Reject excess decimal places instead of silently rounding user input.
    if amount.as_tuple().exponent < -2:
        raise InvalidMoney

    with localcontext() as context:
        context.prec = 16
        return amount.quantize(CENT)
