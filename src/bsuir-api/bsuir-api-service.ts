import * as fetch from 'node-fetch';
import * as moment from 'moment';

import { config } from '../config';
import { XmlParser } from '../utils/xml-parser';
import { ScheduleResponseRaw, EmployeeRaw } from './models';
import { IScheduleDay, IScheduleItem, IGroup, Employee } from '../models';
import { getDayNumberByName } from './bsuir-api-utils';

export class BsuirApiService {
  static getAllGroups() {
    return fetch(config.apiUrls.allGroups)
      .then(res => res.text())
      .then(data => XmlParser.parse(data))
      .then(BsuirApiService.createGroupsModelFromData)
      .catch(e => console.log(JSON.stringify(e)));
  }

  static getScheduleByGroupId(groupId) {
    return fetch(`${config.apiUrls.scheduleById}/${groupId}`)
      .then(res => res.text())
      .then(data => XmlParser.parse(data))
      .then(BsuirApiService.createScheduleModelFromData)
      .catch(e => console.log(JSON.stringify(e)));
  }

  static getWeekNumberByDate(date: Date) {
    let dateString = moment(date).format('DD.MM.YYYY');
    let a = `${config.apiUrls.weekNumberByWeek}/${dateString}`;
    return fetch(a).then(res => res.text()).then(n => {
      console.log(n);
      return +n;
    });
  }

  private static createGroupsModelFromData(groupsDataWrapped) {
    let groupsData = groupsDataWrapped.studentGroupXmlModels.studentGroup;
    let groups: IGroup[] = [];

    for (let rawGroup of groupsData) {
      let groupData: any = {
        apiId: +rawGroup.id,
        name: rawGroup.name,
        course: null,
        facultyId: null,
        schedule: null
      };

      let courseData = rawGroup.course;
      if (courseData) {
        groupData.course = +courseData;
      }
      let facultyIdData = rawGroup.facultyId;
      if (courseData) {
        groupData.facultyId = +facultyIdData;
      }

      groups.push(groupData);
    }

    return groups;
  }

  private static async createScheduleModelFromData(scheduleData: ScheduleResponseRaw) {
    let schedule: IScheduleDay[] = [];

    for (let day of scheduleData.scheduleXmlModels.scheduleModel) {
      let scheduleDay: IScheduleDay = {
        dayNumber: getDayNumberByName(day.weekDay),
        schedule: []
      };

      for (let item of day.schedule) {
        let scheduleItem: IScheduleItem = {
          auditory: item.auditory,
          lessonType: item.lessonType,
          note: item.note,
          subgroup: +item.numSubgroup,
          subjectName: item.subject,
          timeFrom: null,
          timeTo: null,
          employeeId: null,
          weekNumbers: []
        };

        let times = item.lessonTime.match(/(\d+:\d+)/g);

        let [timeFrom, timeTo] = times.map(s => moment(s, 'HH:mm')).map(m => m.toDate());
        scheduleItem.timeFrom = timeFrom;
        scheduleItem.timeTo = timeTo;

        if (item.employee) {
          let employee = await BsuirApiService.findOrSaveEmployee(item.employee);
          scheduleItem.employeeId = employee._id;
        }

        if (typeof item.weekNumber === 'string') {
          scheduleItem.weekNumbers.push(+item.weekNumber);
        } else {
          scheduleItem.weekNumbers = item.weekNumber.map(n => +n);
        }

        scheduleDay.schedule.push(scheduleItem);
      }

      schedule.push(scheduleDay);
    }

    return schedule;
  }

  private static async findOrSaveEmployee(employeeData: EmployeeRaw) {
    let employee = await Employee.findOne({ apiId: employeeData.id });
    if (!employee) {
      employee = new Employee({
        apiId: employeeData.id,
        firstName: employeeData.firstName,
        middleName: employeeData.middleName,
        lastName: employeeData.lastName,
        rank: employeeData.rank,
        calendarId: employeeData.calendarId,
        academicDepartment: []
      });

      if (typeof employeeData.academicDepartment === 'string') {
        employee.academicDepartment.push(employeeData.academicDepartment);
      } else {
        employee.academicDepartment = employeeData.academicDepartment;
      }

      await employee.save();
    }

    return employee;
  }
}