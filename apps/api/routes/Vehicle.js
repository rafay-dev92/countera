const express = require('express');
const router = express.Router();
const { Vehicle } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
require('dotenv').config();

router.get('/', fetchUser, async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id, {
            include: ['Customer', 'Vehicle']
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', fetchUser, async (req, res) => {
    try {
        const vehicleData = req.body;
        const existingVehicle = await Vehicle.findOne({
            where: { make: vehicleData.make, model: vehicleData.model, year: vehicleData.year }
        });

        if (existingVehicle) {
            return res.status(409).json({ message: 'Vehicle already exists' });
        } 
        await Vehicle.create(vehicleData);
        return res.status(200).json({message: 'Vehicle added successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'vehicle not found' });
        }

        await vehicle.update(req.body);

        return res.status(200).json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'vehicle not found' });
        }

        await vehicle.destroy();
        return res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting vehicle' });
    }
})

module.exports = router;