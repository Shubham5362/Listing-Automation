"""Personal AI Seller Hub backend package."""
import enum

try:
    from enum import StrEnum
except ImportError:
    try:
        from strenum import StrEnum
        enum.StrEnum = StrEnum
    except ImportError:
        class StrEnum(str, enum.Enum):
            def __str__(self):
                return str(self.value)
        enum.StrEnum = StrEnum

