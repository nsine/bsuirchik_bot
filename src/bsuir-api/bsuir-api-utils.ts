export function getDayNumberByName(dayName: string) {
    let days = {
        'Понедельник': 0,
        'Вторник': 1,
        'Среда': 2,
        'Четверг': 3,
        'Пятница': 4,
        'Суббота': 5
    };

    return days[dayName];
}