const express = require('express');
const router = express.Router();
const { Address } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
require('dotenv').config();

router.get('/', fetchUser, async (req, res) => {
    try {
        const addresses = await Address.findAll();
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const address = await Address.findByPk(req.params.id);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const addressData = req.body;
        const newAddress = await Address.create(addressData);
        res.json(newAddress);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const address = await Address.findByPk(req.params.id);

        if (!address) {
            return res.status(404).json({ message: 'address not found' });
        }

        await address.update(req.body);

        res.json({ message: 'Address updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const address = await Address.findByPk(req.params.id);

        if (!address) {
            return res.status(404).json({ message: 'address not found' });
        }

        await address.destroy();

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

module.exports = router;