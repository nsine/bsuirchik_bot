import * as mongoose from 'mongoose';
import { UserStatus } from "./user-status";

interface IUser extends mongoose.Document {
  telegramId: string;
  group: string;
  status: UserStatus;
}

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  group: String,
  status: { type: Number, enum: UserStatus }
});

export const User = mongoose.model<IUser>('User', UserSchema);
