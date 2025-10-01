export const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
export const isUsername = (s) => /^[a-zA-Z0-9_.-]{3,32}$/.test(s || '');
export const isPassword = (s) => typeof s === 'string' && s.length >= 8; // tune as needed


export function validateNewUser(body) {
const { first_name, last_name, username, password } = body || {};
if (!isNonEmpty(first_name) || !isNonEmpty(last_name)) return 'first_name and last_name are required';
if (!isUsername(username)) return 'username must be 3-32 chars (letters, numbers, _.-)';
if (!isPassword(password)) return 'password must be at least 8 characters';
return null;
}


export function validateUserUpdate(body) {
if (!body) return 'body required';
if ('username' in body || 'account_created' in body || 'account_updated' in body || 'id' in body) {
return 'username/id/account_* fields are immutable';
}
const { first_name, last_name, password } = body;
if (first_name !== undefined && !isNonEmpty(first_name)) return 'first_name invalid';
if (last_name !== undefined && !isNonEmpty(last_name)) return 'last_name invalid';
if (password !== undefined && !isPassword(password)) return 'password must be at least 8 characters';
return null;
}

export function validateNewProduct(body) {
    const { name, description, sku, manufacturer, quantity } = body || {};
    if (![name, description, sku, manufacturer].every(isNonEmpty)) return 'name, description, sku, manufacturer are required';
    if (!Number.isInteger(quantity) || quantity < 0) return 'quantity must be an integer >= 0';
    return null;
    }
    
    
    export function validateProductUpdate(body) {
    if (!body) return 'body required';
    if ('id' in body || 'owner_user_id' in body || 'date_added' in body || 'date_last_updated' in body) {
    return 'id/owner/date fields are immutable';
    }
    if ('quantity' in body) {
    const q = body.quantity;
    if (!Number.isInteger(q) || q < 0) return 'quantity must be an integer >= 0';
    }
    return null;
    }