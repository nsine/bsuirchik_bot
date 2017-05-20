import * as mongoose from 'mongoose';

interface IGroup extends mongoose.Document {
  id: number;
  name: number;
  course: number;
  facultyId: number;
}

const GroupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: Number, required: true },
  course: Number,
  facultyId: Number
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
