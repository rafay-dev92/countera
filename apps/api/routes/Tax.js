const express = require('express');
const router = express.Router();
const { Tax } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const taxes = await Tax.findAll();
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'Tax not found' });
        }

        res.json(tax);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const taxData = req.body;
        const existingTax = await Tax.findOne({
            where: { name: taxData.name }
        });

        if (existingTax) {
            res.status(409).json({ message: 'Tax with this name already exists' });
        } 
        const newTax = await Tax.create(taxData);
        res.json(newTax);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        await tax.update(req.body);

        res.json({ message: 'Tax updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        await tax.destroy();

        res.json({ message: 'Tax deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting tax' });
    }
})

module.exports = router;