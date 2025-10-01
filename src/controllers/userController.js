import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername, getUserById, updateUser } from '../models/userModel.js';
import { validateNewUser, validateUserUpdate } from '../utils/validate.js';


const SALT_ROUNDS = 10;


export async function createUserHandler(req, res) {
const err = validateNewUser(req.body);
if (err) return res.status(400).json({ error: err });
const { first_name, last_name, username, password } = req.body;


const existing = await getUserByUsername(username);
if (existing) return res.status(409).json({ error: 'username already exists' });


const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
const user = await createUser({ first_name, last_name, username, password_hash });
return res.status(201).json(user);
}
export async function loginHandler(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const u = await getUserByUsername(username);
    if (!u) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: u.id, username: u.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
    }
    
    
    export async function getUserHandler(req, res) {
    const { userId } = req.params;
    if (req.user.id !== userId) return res.status(403).json({ error: 'forbidden' });
    const u = await getUserById(userId);
    if (!u) return res.status(404).json({ error: 'not found' });
    return res.json(u);
    }
    export async function putUserHandler(req, res) {
        const { userId } = req.params;
        if (req.user.id !== userId) return res.status(403).json({ error: 'forbidden' });
        const err = validateUserUpdate(req.body);
        if (err) return res.status(400).json({ error: err });
        
        
        const payload = {};
        if (req.body.first_name !== undefined) payload.first_name = req.body.first_name;
        if (req.body.last_name !== undefined) payload.last_name = req.body.last_name;
        if (req.body.password !== undefined) payload.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        
        
        const updated = await updateUser(userId, payload);
        if (!updated) return res.status(404).json({ error: 'not found' });
        return res.json(updated);
        }