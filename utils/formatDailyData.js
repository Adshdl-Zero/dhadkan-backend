const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDailyData = (dailyData) => {
    let result = [];
    dailyData.forEach(entry => {
        result.push(extractSingle(entry));
    });
    result.reverse();
    return result;
}


const generateGraphData = (dailyData) => {
    let result = {times: [], sbp: [], dbp: [], weight: []};

    if (dailyData.length === 0) return result;

    const start_time = new Date(dailyData[0].time);

    dailyData.forEach(entry => {
        if (entry.sbp <= 160 && entry.sbp >= 60 && entry.dbp <= 160 && entry.dbp >= 60 && entry.weight <= 160 ) {
            result['sbp'].push(entry.sbp);
            result['dbp'].push(entry.dbp);
            result['weight'].push(entry.weight);
            const current_time = new Date(entry.time);
            const difference = current_time - start_time;
            const diff_minutes = difference / 60000;
            result['times'].push(diff_minutes);
        }

    });
    return result;


}
const extractSingle = (entry) => {
    const timeString = entry.time;
    const [datePart, timePart] = timeString.split(", ");
    let [day, month, year] = datePart.split("/");
    const [hour, minute, second] = timePart.split(" ")[0].split(":");
    const timeObject = new Date(year, month-1, day, hour, minute, second);
    const date = day + " " + months[parseInt(month) - 1];
    const time = timeObject.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit',
        minute: '2-digit'
    }).toUpperCase();
    const sbp = entry.sbp;
    const dbp = entry.dbp;
    const weight = entry.weight;
    const patient = entry.patient;
    const id = entry.id;
    return {
        time, date, year, sbp, dbp, weight, patient, id
    }
}

module.exports = {
    formatDailyData,
    generateGraphData
}