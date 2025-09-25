const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const userModel = require('../models/userModel');

const dataFile = path.join(__dirname, '../data/users.json');

// Helper to read/write JSON file
function readUsers() {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
}
function writeUsers(users) {
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

// Create User
exports.createUser = (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: Date.now(),
        email,
        password: hashedPassword,
        first_name,
        last_name,
        account_created: new Date(),
        account_updated: new Date()
    };

    users.push(newUser);
    writeUsers(users);

    // Remove password from response
    const { password: pw, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
};

// Get User
exports.getUser = (req, res) => {
    const email = req.params.email;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
};

// Update User
exports.updateUser = (req, res) => {
    const email = req.params.email;
    const { first_name, last_name, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (password) user.password = bcrypt.hashSync(password, 10);
    user.account_updated = new Date();

    writeUsers(users);
    const { password: pw, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
};
exports.loginUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'mysecretkey',
        { expiresIn: '1h' }
    );

    res.json({ token });
};