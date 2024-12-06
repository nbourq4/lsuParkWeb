const mongoose = require('mongoose');

const { stringify } = require('querystring');

const AvailabilitySchema = new mongoose.Schema({
    time_7am: { type: Number, default: 0 },
    time_11am: { type: Number, default: 0 },
    time_2pm: { type: Number, default: 0 },
    time_4pm: { type: Number, default: 0 },
}, { _id: false });

const ParkingLotSchema = new mongoose.Schema({
    lotName: { type: String, required: true },
    lotNumber: { type: String, required: true },
    totalSpaces: { type: Number, required: true },
    availability: {
        Monday: { type: AvailabilitySchema, default: () => ({}) },
        Tuesday: { type: AvailabilitySchema, default: () => ({}) },
        Wednesday: { type: AvailabilitySchema, default: () => ({}) },
        Thursday: { type: AvailabilitySchema, default: () => ({}) },
        Friday: { type: AvailabilitySchema, default: () => ({}) },
    }
});

const parkingLotSchema = new mongoose.Schema({
  lotName: {
    type: String,
    required: true
  },
  lotNumber: {
    type: String,
    required: true
  },
  totalSpaces: {
    type: Number,
    required: true
  },
  availability: {
    monday: {
      time_7am: String,
      time_11am: String,
      time_2pm: String,
      time_4pm: String,
    },
    tuesday: {
      time_7am: String,
      time_11am: String,
      time_2pm: String,
      time_4pm: String,
    },
    wednesday:{
      time_7am: String,
      time_11am: String,
      time_2pm: String,
      time_4pm: String,
    },
    thursday: {
      time_7am: String,
      time_11am: String,
      time_2pm: String,
      time_4pm: String,
    },
    friday: {
      time_7am: String,
      time_11am: String,
      time_2pm: String,
      time_4pm: String,
    }
}

});

module.exports = mongoose.model('ParkingLot', ParkingLotSchema);


