import * as mongoose from 'mongoose';

export interface IEmployee extends mongoose.Document {
    apiId: number;
    firstName: string;
    middleName: string;
    lastName: string;
    rank: string;
    calendarId: string;
    academicDepartment: string[];
}

const EmployeeSchema = new mongoose.Schema({
    apiId: { type: Number, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    rank: String,
    calendarId: String,
    academicDepartment: [String]
});

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
