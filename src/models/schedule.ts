import * as mongoose from 'mongoose';

interface ISchedule extends mongoose.Document {
  id: number;
  name: number;
  course: number;
  facultyId: number;
}

const ScheduleSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: Number, required: true },
  course: Number,
  facultyId: Number
});

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
