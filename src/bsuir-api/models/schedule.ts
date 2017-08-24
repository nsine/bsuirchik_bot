import { EmployeeRaw } from './employee';

export interface ScheduleResponseRaw {
    scheduleXmlModels: {
        scheduleModel: ScheduleDayRaw[]
    }
}

export interface ScheduleDayRaw {
    weekDay: string;
    schedule: ScheduleItemRaw[] | ScheduleItemRaw;
}

export interface ScheduleItemRaw {
    zaoch: boolean;
    weekNumber: string[] | string;
    subject: string;
    studentGroup: string;
    numSubgroup: string;
    note: string;
    lessonType: string;
    lessonTime: string;
    employee: EmployeeRaw;
    auditory: string;
}
