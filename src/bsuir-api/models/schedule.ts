import { EmployeeRaw } from './employee';
import { GroupRaw } from './group';

export interface ScheduleResponseRaw {
    employee: string;
    studentGroup: GroupRaw;
    schedules: ScheduleDayRaw[];
    examSchedules: ScheduleDayRaw[];
    todayDate: string;
    todaySchedules: ScheduleItemRaw[];
    tomorrowDate: string;
    tomorrowSchedules: ScheduleItemRaw[];
    currentWeekNumber: number;
}

export interface ScheduleDayRaw {
    weekDay: string;
    schedule: ScheduleItemRaw[];
}

export interface ScheduleItemRaw {
    weekNumber: number[];
    studentGroup: string[];
    numSubgroup: number;
    auditory: string[];
    startLessonTime: string;
    endLessonTime: string;
    subject: string;
    note: string;
    lessonType: string;
    employee: EmployeeRaw[];
    zaoch: boolean;
}
