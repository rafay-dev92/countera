const express = require('express');
const router = express.Router();
const { Business, User } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const business = await Business.findAll({ include : ['User', 'Customer'] });
        res.json(business);
    } catch (error) {
        console.log("here")
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const business = await Business.findByPk(req.params.id, {
            include: ['User', 'Customer']
        });

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const businessData = req.body;
        const existingBusiness = await Business.findOne({
            where: { name: businessData.name }
        });

        if (existingBusiness) {
            res.status(409).json({ message: 'Business with this name already exists' });
        } 
        const newBusiness = await Business.create(businessData);
        res.json(newBusiness);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const business = await Business.findByPk(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'business not found' });
        }

        await business.update(req.body);

        res.json({ message: 'Business updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const business = await Business.findByPk(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'business not found' });
        }

        await business.destroy();

        res.json({ message: 'Business deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

module.exports = router;