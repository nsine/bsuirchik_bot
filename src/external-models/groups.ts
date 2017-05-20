export interface GroupsResponseRaw {
    studentGroupXmlModels: {
        studentGroup: GroupRaw[];
    };
}

export interface GroupRaw {
    id: string[];
    calendarId: string[];
    facultyId: string[];
    name: string[];
    course: string[];
    specialityDepartmentEducationFormId: string[];
}