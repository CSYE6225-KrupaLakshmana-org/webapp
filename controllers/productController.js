const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataFile = path.join(__dirname, '../data/products.json');

// Helper to read/write JSON file
function readProducts() {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
}
function writeProducts(products) {
    fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

// Add Product
exports.addProduct = (req, res) => {
    const { name, quantity } = req.body;
    if (!name || quantity === undefined) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (quantity < 0) return res.status(400).json({ error: 'Quantity cannot be negative' });

    const products = readProducts();
    const newProduct = {
        id: uuidv4(),
        name,
        quantity,
        created_by: req.user.email,
        created_at: new Date(),
        updated_at: new Date()
    };

    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
};

// Update Product
exports.updateProduct = (req, res) => {
    const id = req.params.id;
    const { name, quantity } = req.body;
    const products = readProducts();
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.created_by !== req.user.email) return res.status(403).json({ error: 'Not authorized' });

    if (name) product.name = name;
    if (quantity !== undefined) {
        if (quantity < 0) return res.status(400).json({ error: 'Quantity cannot be negative' });
        product.quantity = quantity;
    }
    product.updated_at = new Date();

    writeProducts(products);
    res.json(product);
};

// Delete Product
exports.deleteProduct = (req, res) => {
    const id = req.params.id;
    const products = readProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });
    if (products[productIndex].created_by !== req.user.email) return res.status(403).json({ error: 'Not authorized' });

    const deleted = products.splice(productIndex, 1);
    writeProducts(products);
    res.json({ message: 'Product deleted', product: deleted[0] });
};
