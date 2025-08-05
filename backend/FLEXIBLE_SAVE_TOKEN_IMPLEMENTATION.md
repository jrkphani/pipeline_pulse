# Flexible save_token Method Implementation

## Overview

This document describes the implementation of a flexible `save_token` method that can handle both the official Zoho SDK interface and buggy SDK calls that use incorrect signatures.

## Problem Statement

The Zoho SDK has inconsistent implementations where some versions call:
- `save_token(user, token)` - correct official interface
- `save_token(token)` - buggy SDK call missing the user parameter

This creates compatibility issues when switching between SDK versions or when SDKs internally call the method incorrectly.

## Solution

We implemented a defensive workaround using Python's `*args` to detect which signature is being used and handle both cases appropriately.

### Method Signature

```python
def save_token(self, *args) -> None:
    """
    Flexible method to save a token using either:
    - save_token(user, token) - correct official interface
    - save_token(token) - buggy SDK call
    """
```

### Implementation Details

#### 1. Argument Detection

```python
if len(args) == 2:
    user, token = args
    user_email = self._extract_user_email(user)
elif len(args) == 1:
    token, = args
    user_email = getattr(token, 'user_mail', None) or 'default_email@example.com'
else:
    raise ValueError("Invalid number of arguments provided to save_token")
```

#### 2. User Email Extraction

For the two-argument case, we extract the user email using multiple fallback methods:

```python
def _extract_user_email(self, user) -> str:
    """Extract email from UserSignature object or string"""
    if hasattr(user, 'email'):
        return user.email
    elif hasattr(user, 'get_email'):
        return user.get_email()
    elif isinstance(user, str):
        return user
    else:
        return str(user)
```

#### 3. Token Attribute Extraction

We use robust attribute extraction that handles different token object formats:

```python
def _extract_token_attribute(self, token, attribute: str):
    """Extract attribute from token object with multiple fallback patterns"""
    if hasattr(token, attribute):
        return getattr(token, attribute)
    elif hasattr(token, f'_{attribute}'):
        return getattr(token, f'_{attribute}')
    elif hasattr(token, f'get_{attribute}'):
        method = getattr(token, f'get_{attribute}')
        return method() if callable(method) else method
    return None
```

## Implementation Files

### 1. ImprovedZohoTokenStore (app/services/improved_zoho_token_store.py)

This implementation follows the official Zoho schema with the `oauthtoken` table:

```python
def save_token(self, *args) -> None:
    # Handle both possible method signatures
    if len(args) == 2:
        user, token = args
        user_email = self._extract_user_email(user)
    elif len(args) == 1:
        token, = args
        user_email = getattr(token, 'user_mail', None) or 'default_email@example.com'
    else:
        raise ValueError("Invalid number of arguments provided to save_token")
    
    # Extract token attributes and save to database
    # ... (implementation continues)
```

### 2. SQLiteTokenStore (app/services/custom_sqlite_token_store.py)

This implementation uses the legacy `zoho_oauth_tokens` table format:

```python
def save_token(self, *args) -> None:
    # Handle both possible method signatures
    if len(args) == 2:
        user, token = args
        # Extract user identifier from user object or string
        if hasattr(user, 'email'):
            token_id = user.email
        elif hasattr(user, 'get_email'):
            token_id = user.get_email()
        elif isinstance(user, str):
            token_id = user
        else:
            token_id = str(user)
    elif len(args) == 1:
        token, = args
        # Extract token id from token object
        token_id = getattr(token, 'id', None) or getattr(token, '_id', None) or 'admin@1cloudhub.com'
    else:
        raise ValueError("Invalid number of arguments provided to save_token")
    
    # Extract token attributes and save to database
    # ... (implementation continues)
```

## Key Features

### 1. Backward Compatibility
- Existing code using `save_token(user, token)` continues to work unchanged
- No breaking changes to the API

### 2. Forward Compatibility
- Handles buggy SDK calls using `save_token(token)` gracefully
- Provides sensible defaults when user information is missing

### 3. Robust Error Handling
- Validates argument count and provides clear error messages
- Handles missing or malformed token attributes gracefully
- Logs appropriate warnings and errors

### 4. Flexible User Extraction
- Supports UserSignature objects with `.email` attribute
- Supports UserSignature objects with `.get_email()` method
- Supports string user identifiers
- Fallback to string representation for unknown types

### 5. Default Fallbacks
- Uses `default_email@example.com` when no user information is available
- Uses `admin@1cloudhub.com` for legacy compatibility
- Sets reasonable default expiry times when not provided

## Testing

The implementation includes comprehensive tests covering:

1. **Two-argument signature testing**: `save_token(user, token)`
2. **One-argument signature testing**: `save_token(token)`
3. **Invalid argument count handling**: Raises `ValueError` for 0 or 3+ arguments
4. **Backward compatibility**: Existing code continues to work
5. **User extraction methods**: Various user object types
6. **Token updates**: Updating existing tokens with different signatures
7. **Error handling**: Graceful handling of invalid tokens
8. **Mixed usage scenarios**: Different signatures in the same session

## Usage Examples

### Official Interface (Two Arguments)
```python
# Traditional usage - continues to work
user = UserSignature("user@example.com")
token = OAuthToken(client_id="client", access_token="access")
token_store.save_token(user, token)
```

### Buggy SDK Call (One Argument)
```python
# Buggy SDK call - now handled gracefully
token = OAuthToken(client_id="client", access_token="access")
token.user_mail = "user@example.com"  # User info in token
token_store.save_token(token)
```

### String User Identifier
```python
# Simple string user
token = OAuthToken(client_id="client", access_token="access")
token_store.save_token("user@example.com", token)
```

## Benefits

1. **Seamless Migration**: Switch between SDK versions without code changes
2. **Defensive Programming**: Handles SDK bugs gracefully
3. **Production Ready**: Robust error handling and logging
4. **Maintainable**: Clear code structure with comprehensive documentation
5. **Future Proof**: Adaptable to new SDK versions and patterns

## Monitoring and Logging

The implementation includes detailed logging to help monitor usage patterns:

```python
logger.debug(f"✅ Updated token for user: {user_email}")
logger.debug(f"✅ Saved new token for user: {user_email}")
logger.error(f"❌ Error saving token: {e}")
```

This allows you to:
- Monitor which signature is being used
- Track token operations
- Debug issues with SDK compatibility
- Identify patterns in token usage

## Conclusion

The flexible `save_token` method implementation provides a robust, backward-compatible solution that handles both correct and buggy SDK calls. It maintains the integrity of the token storage system while providing graceful degradation for edge cases.

This approach follows the principle of "be conservative in what you do, be liberal in what you accept from others" (Postel's Law), making the system more resilient and easier to maintain.
