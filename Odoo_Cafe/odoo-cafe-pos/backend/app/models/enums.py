import enum


class DiscountType(str, enum.Enum):
    percent = "percent"
    fixed = "fixed"
