const _dateJs = require('datejs')

module.exports = {
    parseTime: function (dateStr) {
        if (dateStr.length == 7) { // 9:20 AM
            return Date.parse(dateStr)
        } else if (dateStr.includes('Yesterday')) { // Yesterday, 9:20 AM
            let parts = dateStr.split(', ')
            let date = new Date()
            date.setDate(date.getDate() - 1)
            let time = convertTime12to24(parts[1])
            date.setHours(time.getHours())
            date.setMinutes(time.getMinutes())
            return date
        } else if (countInstances(dateStr, ',') == 2) { // Dec 22, 2020, 9:11 PM
            let parts = dateStr.split(', ')
            let date = Date.parse(parts[0])
            date.setYear(parts[1])
            let time = convertTime12to24(parts[2])
            date.setHours(time.getHours())
            date.setMinutes(time.getMinutes())
            return date
        } else { // Tue 9:31 PM
            let parts = dateStr.split(' ')
            let date = Date.parse("last " + parts[0])
            let time = convertTime12to24(parts[1] + ' ' + parts[2])
            date.setHours(time.getHours())
            date.setMinutes(time.getMinutes())
            return date
        }
    }
}

function countInstances(string, word) {
    return string.split(word).length - 1;
}

function convertTime12to24(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
        hours = '00';
    }
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    let date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    return date
}
