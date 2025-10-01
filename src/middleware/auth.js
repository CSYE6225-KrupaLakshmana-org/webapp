import jwt from 'jsonwebtoken';


export function requireAuth(req, res, next) {
const hdr = req.headers.authorization || '';
const [scheme, token] = hdr.split(' ');
if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Unauthorized' });


try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.sub, username: payload.username };
next();
} catch (e) {
return res.status(401).json({ error: 'Invalid token' });
}
}