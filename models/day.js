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
    tasks: [taskSchema],
    dvorush: {
        type: [taskSchema],
        default: undefined // יתמלא אוטומטית ב-pre save
    },
    di: [{ type: String }] // הוספת מערך סטרינגים רגילים
});

// הוספת hook שממלא את dvorush אוטומטית אם לא קיים
daySchema.pre('save', function(next) {
    if (!this.dvorush || this.dvorush.length === 0) {
        this.dvorush = [
            { title: 'לעזוב את המחשב ב10 ולחזור אליו כשמאורגנים לגמרי', completed: false },
            { title: 'לא לאכול בין הארוחות!!!!', completed: false },
            { title: 'לא לעשות כלום כשאוכלים!!', completed: false }
        ];
    }
    next();
});

const Day = mongoose.model('Day', daySchema);
export default Day;