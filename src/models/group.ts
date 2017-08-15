import * as mongoose from 'mongoose';
import { Employee } from './employee';

export interface ScheduleDay {
  dayNumber: number;
  schedule: ScheduleItem[];
}

export interface ScheduleItem {
  subjectName: string;
  subgroup: number;
  note: string;
  lessonType: string;
  time: string;
  auditory: string;
  employeeId: mongoose.Schema.Types.ObjectId;
  weekNumbers: number[];
}

interface IGroup extends mongoose.Document {
  id: number;
  name: string;
  course: number;
  facultyId: number;
  schedule: ScheduleDay[];
}

const GroupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  course: Number,
  facultyId: Number,
  schedule: Object
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
