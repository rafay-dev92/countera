const express = require('express');
const router = express.Router();
const { Vehicle } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id, {
            include: ['Customer', 'Vehicle']
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const vehicleData = req.body;
        const existingVehicle = await Vehicle.findOne({
            where: { model: vehicleData.model }
        });

        if (existingVehicle) {
            res.status(409).json({ message: 'Vehicle with this name already exists' });
        } 
        const newVehicle = await Vehicle.create(vehicleData);
        res.json(newVehicle);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'vehicle not found' });
        }

        await vehicle.update(req.body);

        res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'vehicle not found' });
        }

        await vehicle.destroy();

        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting vehicle' });
    }
})

module.exports = router;