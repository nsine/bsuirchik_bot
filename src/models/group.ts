import * as mongoose from 'mongoose';

interface ScheduleDay {

}

interface IGroup extends mongoose.Document {
  id: number;
  name: string;
  course: number;
  facultyId: number;
  schedule: any;
}

const GroupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  course: Number,
  facultyId: Number,
  schedule: Object
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
