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
  apiId: number;
  name: string;
  course?: number;
  facultyId?: number;
  schedule?: IScheduleDay[];
  employees?: mongoose.Types.ObjectId[]
}

const GroupSchema = new mongoose.Schema({
  apiId: { type: Number, required: true },
  name: { type: String, required: true },
  course: Number,
  facultyId: Number,
  schedule: [Object],
  employees: [mongoose.SchemaTypes.ObjectId]
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
