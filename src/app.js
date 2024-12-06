const express = require('express');
const mongoose = require('mongoose');
const ParkingLot = require('./models/parkingLot');
const parkingRoutes = require('./routes/parkingRoutes');
const dotenv = require('dotenv');
const importParkingData = require('./data/importParkingData');
dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const mongoURI = 'mongodb+srv://noahbourque92:XbDSwc8jbVYLVCDn@cluster0.zshst.mongodb.net/parkingDB?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('Connected to MongoDB successfully.');

    const count = await ParkingLot.countDocuments();
    if (count === 0) {
        console.log('No parking data found. Importing data...');
        await importParkingData();
    } else {
        console.log('Parking data already exists. Skipping import.');
    }
})
.catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

app.use('/', parkingRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/availability', async (req, res) => {
    try {
        const parkingLots = await ParkingLot.find();

        const formattedParkingLots = parkingLots.map(lot => {
            const availability = lot.availability || {};
            return {
                lotName: lot.lotName,
                lotNumber: lot.lotNumber,
                totalSpaces: lot.totalSpaces,
                availability: {
                    Monday: {
                        spots_7am: availability.Monday?.time_7am ?? 'Not Available',
                        spots_11am: availability.Monday?.time_11am ?? 'Not Available',
                        spots_2pm: availability.Monday?.time_2pm ?? 'Not Available',
                        spots_4pm: availability.Monday?.time_4pm ?? 'Not Available',
                    },
                    Tuesday: {
                        spots_7am: availability.Tuesday?.time_7am ?? 'Not Available',
                        spots_11am: availability.Tuesday?.time_11am ?? 'Not Available',
                        spots_2pm: availability.Tuesday?.time_2pm ?? 'Not Available',
                        spots_4pm: availability.Tuesday?.time_4pm ?? 'Not Available',
                    },
                    Wednesday: {
                        spots_7am: availability.Wednesday?.time_7am ?? 'Not Available',
                        spots_11am: availability.Wednesday?.time_11am ?? 'Not Available',
                        spots_2pm: availability.Wednesday?.time_2pm ?? 'Not Available',
                        spots_4pm: availability.Wednesday?.time_4pm ?? 'Not Available',
                    },
                    Thursday: {
                        spots_7am: availability.Thursday?.time_7am ?? 'Not Available',
                        spots_11am: availability.Thursday?.time_11am ?? 'Not Available',
                        spots_2pm: availability.Thursday?.time_2pm ?? 'Not Available',
                        spots_4pm: availability.Thursday?.time_4pm ?? 'Not Available',
                    },
                    Friday: {
                        spots_7am: availability.Friday?.time_7am ?? 'Not Available',
                        spots_11am: availability.Friday?.time_11am ?? 'Not Available',
                        spots_2pm: availability.Friday?.time_2pm ?? 'Not Available',
                        spots_4pm: availability.Friday?.time_4pm ?? 'Not Available',
                    }
                }
            };
        });

        console.log('Formatted parking lots:', formattedParkingLots);
        res.render('availability', { parkingLots: formattedParkingLots });
    } catch (error) {
        console.error('Error rendering availability page:', error);
        res.status(500).send('Error rendering availability page: ' + error.message);
    }
});


app.get('/api/availability/:day', async (req, res) => {
    const dayParam = req.params.day;
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const day = dayParam.charAt(0).toUpperCase() + dayParam.slice(1).toLowerCase();

    if (!validDays.includes(day)) {
        return res.status(400).json({ error: 'Invalid day parameter.' });
    }

    try {
        const parkingLots = await ParkingLot.find({
            [`availability.${day}.time_7am`]: { $exists: true },
        });

        const filteredLots = parkingLots.map(lot => ({
            name: lot.lotName,
            lotNumber: lot.lotNumber,
            totalSpaces: lot.totalSpaces,
            availability: lot.availability[day],
        }));

        res.json(filteredLots);
    } catch (error) {
        console.error('Error fetching parking data:', error);
        res.status(500).send('Error fetching parking data: ' + error.message);
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
