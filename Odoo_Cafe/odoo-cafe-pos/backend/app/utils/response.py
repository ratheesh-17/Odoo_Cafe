from typing import Any


def success(data: Any = None, message: str = "Success") -> dict:
    return {"success": True, "message": message, "data": data}


def error(message: str, status_code: int = 400) -> dict:
    return {"success": False, "message": message, "status_code": status_code}
