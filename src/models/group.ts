import * as mongoose from 'mongoose';
import { Employee } from './employee';

export interface IScheduleDay {
  dayNumber: number;
  schedule: IScheduleItem[];
}

export interface IScheduleItem {
  subjectName: string;
  subgroup: number;
  note: string;
  lessonType: string;
  timeFrom: Date;
  timeTo: Date;
  auditory: string;
  employeeId: mongoose.Schema.Types.ObjectId;
  weekNumbers: number[];
}

export interface IGroup extends mongoose.Document {
  id: number;
  name: string;
  course: number;
  facultyId: number;
  schedule: IScheduleDay[];
}

const GroupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  course: Number,
  facultyId: Number,
  schedule: Object
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
