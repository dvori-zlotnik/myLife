import express from 'express';
import mongoose from 'mongoose';
import Day from './models/day.js'
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
;
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.put('/api/move-task', async (req, res) => {
  try {
    const { fromDayId, taskId, toDayId } = req.body;
    if (!fromDayId || !taskId || !toDayId) {
      return res.status(400).json({ error: 'fromDayId, taskId, and toDayId are required' });
    }

    // מצא את היום המקורי
    const fromDay = await Day.findById(fromDayId);
    if (!fromDay) {
      return res.status(404).json({ error: 'Source day not found' });
    }

    // מצא את המשימה
    const task = fromDay.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found in source day' });
    }

    // מצא את היום היעד
    let toDay = await Day.findById(toDayId);
    if (!toDay) {
      return res.status(404).json({ error: 'Target day not found' });
    }

    // הוסף את המשימה ליום היעד
    toDay.tasks.push({
      title: task.title,
      description: task.description,
      completed: task.completed
    });

    // מחק את המשימה מהיום המקורי
    task.remove();

    await fromDay.save();
    await toDay.save();

    res.status(200).json({ message: 'Task moved successfully', fromDay, toDay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/add-task', async (req, res) => {
  try {
    const { title, description, date } = req.body;

    // קבע תאריך יעד: אם לא התקבל תאריך, השתמש בתאריך של היום
    let targetDate;
    if (date) {
      targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    // מצא או צור את היום המתאים
    let day = await Day.findOne({ date: targetDate });
    if (!day) {
      day = new Day({
        date: targetDate,
        notes: '',
        tasks: []
      });
    }

    day.tasks.push({
      title: title,
      description: description
    });
    await day.save();

    res.status(201).json(day);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/day', async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }
    const now = new Date();
    let targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);

    // אם השעה בין 00:00 ל-06:00, ייצר אתמול
    if (now.getHours() >= 0 && now.getHours() < 6) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
    let day = await Day.findOne({ date: targetDate });
    if (day) {
      // אם קיים, הוסף את ה-note
      day.notes += (day.notes ? '\n' : '') + note;
      await day.save();
      return res.status(200).json(day);
    } else {
      // אם לא קיים, צור יום חדש
      day = new Day({
        date: targetDate,
        notes: note,
        tasks: []
      });
      await day.save();
      return res.status(201).json(day);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/update-task', async (req, res) => {
  try {
    const { dayId, taskId, description, completed } = req.body;
    if (!dayId || !taskId) {
      return res.status(400).json({ error: 'dayId and taskId are required' });
    }

    // מצא את היום שמכיל את המשימה
    const day = await Day.findById(dayId);
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    // מצא את המשימה במערך
    const task = day.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // עדכן את השדות
    if (typeof description === 'string') {
      task.description = description;
    }
    if (typeof completed === 'boolean') {
      task.completed = completed;
    }

    await day.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/days', async (req, res) => {
  try {
    const days = await Day.find().sort({ date: 1 }); // מיון לפי תאריך עולה
    res.status(200).json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
);
app.delete('/api/delete-task', async (req, res) => {
  try {
    const { dayId, taskId } = req.body;
    if (!dayId || !taskId) {
      return res.status(400).json({ error: 'dayId and taskId are required' });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    const task = day.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.remove();
    await day.save();

    res.status(200).json({ message: 'Task deleted successfully', day });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/update-day', async (req, res) => {
  try {
    const { dayId, note } = req.body;
    if (!dayId || typeof note !== 'string') {
      return res.status(400).json({ error: 'dayId and note are required' });
    }

    const day = await Day.findById(dayId);
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    day.notes = note;
    await day.save();

    res.status(200).json(day);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
