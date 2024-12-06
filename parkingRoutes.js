// routes/parkingRoutes.js
const express = require('express');
const router = express.Router();
const ParkingLot = require('../models/parkingLot');
const { error } = require('console');

router.get('/admin', async (req, res) => {
    try {
        const parkingLots = await ParkingLot.find();
        const message = req.query.message || '';
        const error = req.query.error || '';
        res.render('admin', { parkingLots, message, error });
        } catch (error) {
                console.error('Error fetching parking lots:', error);
                res.status(500).send('Error fetching parking lots.');
        }
});

router.post('/api/parking/add', async (req, res) => {
    const { lotName, lotNumber, totalSpaces, availability } = req.body;

    if (!lotName || !lotNumber || !totalSpaces || !availability) {
        return res.status(400).send('All fields are required.');
    }

    const newLot = new ParkingLot({
        lotName,
        lotNumber,
        totalSpaces,
        availability,
    });

    try {
        await newLot.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Failed to add parking lot:', error);
        res.status(500).send('Failed to add parking lot.');
    }
});

router.post('/api/parking/delete', async (req, res) => {
    const { lotId } = req.body;

    if (!lotId) {
        return res.status(400).send('Lot ID is required.');
    }

    try {
        await ParkingLot.findByIdAndDelete(lotId);
        res.redirect('/admin');
    } catch (error) {
        console.error('Failed to delete parking lot:', error);
        res.status(500).send('Failed to delete parking lot.');
    }
});

router.post('/api/parking/take-spot', async (req, res) => {
    const { lotNumber, day, time } = req.body;

    if (!lotNumber || !day || !time) {
        return res.status(400).send('Lot number, day, and time are required.');
    }

    try {
        const parkingLot = await ParkingLot.findOne({ lotNumber });

        if (!parkingLot) {
            return res.status(404).send('Parking lot not found.');
        }

        if (!parkingLot.availability[day]) {
            return res.status(400).send(`Availability for ${day} is not defined.`);
        }

        if (parkingLot.availability[day][time] === undefined) {
            return res.status(400).send(`Time slot ${time} is not defined for ${day}.`);
        }

        if (parkingLot.availability[day][time] <= 0) {
            return res.status(400).send('No available spots for the selected time.');
        }

        parkingLot.availability[day][time] -= 1;

        await parkingLot.save();

        res.redirect('/admin?message=Spot taken successfully.');
    } catch (error) {
        console.error('Error taking a parking spot:', error);
        res.status(500).send('Error taking a parking spot.');
    }
});
    router.post('/api/parking/free-spot', async (req, res) => {
        const { lotNumber, day, time } = req.body;
    
        // Validate inputs
        if (!lotNumber || !day || !time) {
            return res.redirect('/admin?error=Lot number, day, and time are required.');
        }
    
        try {
            const parkingLot = await ParkingLot.findOne({ lotNumber });
    
            if (!parkingLot) {
                return res.redirect('/admin?error=Parking lot not found.');
            }
    
            // Check if the day exists in availability
            if (!parkingLot.availability[day]) {
                return res.redirect(`/admin?error=Availability for ${day} is not defined.`);
            }
    
            // Check if the time slot exists
            if (parkingLot.availability[day][time] === undefined) {
                return res.redirect(`/admin?error=Time slot ${time} is not defined for ${day}.`);
            }
    
            // Ensure that the available spots do not exceed total spaces
            const currentAvailable = parkingLot.availability[day][time];
            const totalSpaces = parkingLot.totalSpaces;
    
            // Optional: You can define maximum available spots per time slot if necessary
            // For simplicity, we'll assume that available spots per time slot cannot exceed totalSpaces
            // You might need a more granular approach depending on your requirements
    
            // Calculate the total available spots across all time slots for the day
            let totalAvailableForDay = 0;
            for (const slot in parkingLot.availability[day]) {
                totalAvailableForDay += parkingLot.availability[day][slot];
            }
    
            // Prevent available spots from exceeding totalSpaces
            if (totalAvailableForDay >= totalSpaces) {
                return res.redirect('/admin?error=Cannot free spot. Available spots exceed total spaces.');
            }
    
            const updatedLot = await ParkingLot.findOneAndUpdate(
                { lotNumber, [`availability.${day}.${time}`]: { $lt: parkingLot.totalSpaces } },
                { $inc: { [`availability.${day}.${time}`]: 1 } },
                { new: true }
            );
    
            if (!updatedLot) {
                return res.redirect('/admin?error=Failed to free a spot. It might have reached maximum availability.');
            }
    
            res.redirect('/admin?message=Spot freed successfully.');
        } catch (error) {
            console.error('Error freeing a parking spot:', error);
            res.redirect('/admin?error=Error freeing a parking spot.');
        }
    });

module.exports = router;
