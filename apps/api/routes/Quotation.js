const express = require('express');
const router = express.Router();
const { Quotation } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const quotataions = await Quotation.findAll({
            include: ['Customer', 'Vehicle']
        });
        res.json(quotataions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const quotataion = await Quotation.findByPk(req.params.id, {
            include: ['Customer', 'Vehicle']
        });

        if (!quotataion) {
            return res.status(404).json({ message: 'quotataion not found' });
        }

        res.json(quotataion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const quotataionData = req.body;
       
        const newQuotation = await Quotation.create(quotataionData);
        res.json(newQuotation);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const quotataion = await Quotation.findByPk(req.params.id);

        if (!quotataion) {
            return res.status(404).json({ message: 'quotataion not found' });
        }

        await quotataion.update(req.body);

        res.json({ message: 'Quotation updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const quotataion = await Quotation.findByPk(req.params.id);

        if (!quotataion) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        await quotataion.destroy();

        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting quotataion' });
    }
})

module.exports = router;