from typing import Generic, List, TypeVar
from pydantic import BaseModel
from math import ceil

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
