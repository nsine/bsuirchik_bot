import { Group, Employee, IEmployee, IGroup } from '../models';

export async function findEmployees(query: string, groupName: string) {
  let group = await Group.findOne({ name: groupName });
  let queryParts = query.split(/\s+/);
  queryParts.sort();
  let fullNameQuery = queryParts.join('');

  let results: IEmployee[];

  if (group.employees) {
    results = await findEmployeesForGroup(group, fullNameQuery);
  }

  if (results.length === 0) {
    results = await findEmployeesFromAll(group, fullNameQuery)
  }

  return results;
}

async function findEmployeesForGroup(group: IGroup, fullNameQuery: string) {
  let fullNamePattern = new RegExp(fullNameQuery, 'i');

  let groupEmployees = await Employee.find({
    _id: { $in: group.employees }
  }).and([{ fullNameKey: fullNamePattern }]);

  return groupEmployees;
}

async function findEmployeesFromAll(group: IGroup, fullNameQuery: string) {
  let fullNamePattern = new RegExp(fullNameQuery, 'i');

  let groupEmployees = await Employee.find({ fullNameKey: fullNamePattern });
  return groupEmployees;
}