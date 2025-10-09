// src/utils/validate.js

const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPassword = (s) => typeof s === 'string' && s.length >= 8;
const isInt = (n) => Number.isInteger(n);
const isNonNegativeInt = (n) => isInt(n) && n >= 0;

// ----- USERS -----

export function validateNewUser(b) {
  if (!b) return 'body required';
  const { first_name, last_name, username, password } = b;

  if (![first_name, last_name, username, password].every(isNonEmpty)) {
    return 'first_name,last_name,username,password required';
  }
  if (!isEmail(username)) return 'username must be a valid email address';
  if (!isPassword(password)) return 'password must be >= 8 chars';

  // Disallow system fields
  if ('id' in b || 'account_created' in b || 'account_updated' in b) {
    return 'immutable fields present';
  }
  return null;
}

export function validateUserUpdate(b) {
  if (!b) return 'body required';

  // Username + system fields are immutable
  if ('username' in b || 'id' in b || 'account_created' in b || 'account_updated' in b) {
    return 'immutable fields present';
  }

  if ('first_name' in b && !isNonEmpty(b.first_name)) return 'first_name required';
  if ('last_name' in b && !isNonEmpty(b.last_name)) return 'last_name required';
  if ('password' in b && !isPassword(b.password)) return 'password must be >= 8 chars';

  return null;
}

// ----- PRODUCTS -----

export function validateNewProduct(b) {
  if (!b) return 'body required';

  const { name, description, sku, manufacturer, quantity } = b;

  if (![name, description, sku, manufacturer].every(isNonEmpty)) {
    return 'name,description,sku,manufacturer required';
  }
  if (!isNonNegativeInt(quantity)) return 'quantity must be a non-negative integer';

  // Disallow system/owner fields
  if ('id' in b || 'date_added' in b || 'date_last_updated' in b || 'owner_user_id' in b) {
    return 'immutable fields present';
  }
  return null;
}

export function validateProductUpdate(b) {
  if (!b) return 'body required';

  // Disallow system/owner fields
  if ('id' in b || 'date_added' in b || 'date_last_updated' in b || 'owner_user_id' in b) {
    return 'immutable fields present';
  }

  if ('name' in b && !isNonEmpty(b.name)) return 'name required';
  if ('description' in b && !isNonEmpty(b.description)) return 'description required';
  if ('sku' in b && !isNonEmpty(b.sku)) return 'sku required';
  if ('manufacturer' in b && !isNonEmpty(b.manufacturer)) return 'manufacturer required';
  if ('quantity' in b && !isNonNegativeInt(b.quantity)) {
    return 'quantity must be a non-negative integer';
  }

  return null;
}
