const mongoose = require('mongoose');
const ParkingLot = require('../models/parkingLot');
const fs = require('fs').promises;
const path = require('path');
const fetchParkingData = require('./fetchParkingData');


async function importParkingData() {
    try {

        const dataPath = path.join('parkingData.json');

        fetchParkingData();
        const data = await fs.readFile(dataPath, 'utf8');
        let parkingLots = JSON.parse(data);

        parkingLots = parkingLots.filter(lot => lot.lotName && lot.lotNumber && lot.totalSpaces && lot.availability);

        parkingLots = parkingLots.map(lot => {
            const transformedAvailability = {};

            for (const [day, times] of Object.entries(lot.availability)) {
                const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

                transformedAvailability[capitalizedDay] = {
                    time_7am: typeof times.time_7am === 'number' ? times.time_7am : 0,
                    time_11am: typeof times.time_11am === 'number' ? times.time_11am : 0,
                    time_2pm: typeof times.time_2pm === 'number' ? times.time_2pm : 0,
                    time_4pm: typeof times.time_4pm === 'number' ? times.time_4pm : 0,
                };
            }

            return {
                lotName: lot.lotName,
                lotNumber: lot.lotNumber,
                totalSpaces: lot.totalSpaces,
                availability: transformedAvailability,
            };
        });

        await ParkingLot.deleteMany({});
        console.log('Cleared existing parking lots.');

        const insertedLots = await ParkingLot.insertMany(parkingLots, { ordered: false });
        console.log(`Successfully inserted ${insertedLots.length} parking lots.`);
    } catch (error) {
        console.error('Error importing parking data:', error);
        throw error;
    }
}

module.exports = importParkingData;
