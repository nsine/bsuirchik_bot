import { EmployeeRaw } from './employee';

export interface ScheduleResponseRaw {
    scheduleXmlModels: {
        scheduleModel: ScheduleDayRaw[]
    }
}

export interface ScheduleDayRaw {
    weekDay: string;
    schedule: ScheduleItemRaw[];
}

export interface ScheduleItemRaw {
    zaoch: boolean;
    weekNumber: number[];
    subject: string;
    studentGroup: string;
    numSubgroup: number;
    note: string;
    lessonType: string;
    lessonTime: string;
    employee: EmployeeRaw;
    auditory: string;
}
