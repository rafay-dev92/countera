const express = require('express');
const router = express.Router();
const { Invoice } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.findAll();
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: ['Customer', 'Vehicle']
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const invoiceData = req.body;
       
        const newInvoice = await Invoice.create(invoiceData);
        res.json(newInvoice);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'invoice not found' });
        }

        await invoice.update(req.body);

        res.json({ message: 'Invoice updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'invoice not found' });
        }

        await invoice.destroy();

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting invoice' });
    }
})

module.exports = router;