import mongoose from 'mongoose';
import taskSchema from './task.js';
const daySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    notes: {
        type: String,
        default: ''
    },
    tasks: [taskSchema]
});

const Day = mongoose.model('Day', daySchema);
export default Day;                                                                                         