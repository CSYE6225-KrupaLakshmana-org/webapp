const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dataFile = path.join(__dirname, '../data/users.json');

function readUsers() {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
}

function writeUsers(users) {
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

exports.createUser = async (user) => {
    const users = readUsers();
    const exists = users.find(u => u.email === user.email);
    if (exists) throw new Error('User already exists');

    // Hash password
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    user.account_created = new Date();
    user.account_updated = new Date();

    users.push(user);
    writeUsers(users);
    return { ...user, password: undefined }; // never return password
};

exports.getUserByEmail = (email) => {
    const users = readUsers();
    return users.find(u => u.email === email);
};

exports.updateUser = async (email, updates) => {
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');

    if (updates.first_name) user.first_name = updates.first_name;
    if (updates.last_name) user.last_name = updates.last_name;
    if (updates.password) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(updates.password, saltRounds);
    }
    user.account_updated = new Date();

    writeUsers(users);
    return { ...user, password: undefined };
};

exports.validatePassword = async (email, password) => {
    const user = exports.getUserByEmail(email);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
};
