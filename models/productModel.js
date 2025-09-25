const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataFile = path.join(__dirname, '../data/products.json');

function readProducts() {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
}

function writeProducts(products) {
    fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

exports.addProduct = (product, userEmail) => {
    const products = readProducts();
    const newProduct = {
        id: uuidv4(),
        name: product.name,
        quantity: product.quantity,
        created_by: userEmail,
        created_at: new Date(),
        updated_at: new Date()
    };
    products.push(newProduct);
    writeProducts(products);
    return newProduct;
};

exports.updateProduct = (id, updates, userEmail) => {
    const products = readProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    if (product.created_by !== userEmail) throw new Error('Not authorized');

    if (updates.name) product.name = updates.name;
    if (updates.quantity !== undefined) {
        if (updates.quantity < 0) throw new Error('Quantity cannot be negative');
        product.quantity = updates.quantity;
    }
    product.updated_at = new Date();
    writeProducts(products);
    return product;
};

exports.deleteProduct = (id, userEmail) => {
    const products = readProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    if (products[index].created_by !== userEmail) throw new Error('Not authorized');

    const deleted = products.splice(index, 1);
    writeProducts(products);
    return deleted[0];
};

exports.getAllProducts = () => {
    return readProducts();
};

exports.getProductById = (id) => {
    return readProducts().find(p => p.id === id);
};
