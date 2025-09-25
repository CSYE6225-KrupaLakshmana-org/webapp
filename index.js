const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const userRoutes = require('./routes/users');
const loginRoutes = require('./routes/login');
const productRoutes = require('./routes/products');

const app = express();
app.use(express.json());           // built-in

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/login', loginRoutes);
app.use('/products', productRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
