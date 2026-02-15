from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
class RateLimits:
    """Rate limit presets."""
    
    # Auth endpoints - stricter limits to prevent brute force
    AUTH = "5/minute"  # 5 attempts per minute
    REGISTER = "3/minute"  # 3 registrations per minute
    
    # General API - moderate limits
    DEFAULT = "100/minute"  # 100 requests per minute
    
    # Data-intensive endpoints - higher limits
    ROUTES_LIST = "60/minute"
    ROUTE_DETAIL = "120/minute"
    
    # Write operations - moderate limits
    CREATE = "30/minute"
    UPDATE = "30/minute"
    DELETE = "20/minute"
