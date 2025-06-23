import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    description: { type: String, default: '' },

    // אפשר להוסיף שדות נוספים כאן
});

// const Task = mongoose.model('Task', taskSchema);
export default taskSchema;