const express = require('express');
const router = express.Router();
const { Appointment } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.findAll();
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const appointmentData = req.body;
        const existingAppointment = await Appointment.findOne({
            where: { date: appointmentData.date }
        });

        if (existingAppointment) {
            res.status(409).json({ message: 'Appointment with this name already exists' });
        } 
        const newAppointment = await Appointment.create(appointmentData);
        res.json(newAppointment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'appointment not found' });
        }

        await appointment.update(req.body);

        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'appointment not found' });
        }

        await appointment.destroy();

        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting appointment' });
    }
})

module.exports = router;