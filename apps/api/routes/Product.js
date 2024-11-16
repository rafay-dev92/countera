const express = require('express');
const router = express.Router();
const { Product, Tax } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
require('dotenv').config();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', fetchUser, async (req, res) => {
    try {
        const products = await Product.findAll({
            include: ['Tax']
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', upload.single('image'), async (req, res) => {
    try {
        // const productData = req.body.productData;
        console.log(req.body);
        console.log(req.file);
        // const existingProduct = await Product.findOne({
        //     where: { name: productData.name }
        // });
        // if (existingProduct) {
        //     return res.status(409).json({ message: 'Product with this name already exists' });
        // }
        // const newProduct = await Product.create(productData);
        // if (req.body.taxes.length !== 0) {
        //     req.body.taxes.map(async (item) => {
        //         const tax = await Tax.findByPk(item);
        //         await newProduct.addTax(tax);
        //     })
        // }
        return res.status(200).json({message: 'Product added successfully'});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'product not found' });
        }

        await product.update(req.body);

        return res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'product not found' });
        }

        await product.destroy();

        return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

module.exports = router;