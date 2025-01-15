const moment = require('moment');

function compare(dateTimeA, dateTimeB) {
    var momentA = moment(dateTimeA);
    var momentB = moment(dateTimeB);
    console.log(momentA);
    console.log(momentB);
    if (momentA > momentB) return 0;
    else if (momentA < momentB) return 1;
    else return 0;
}

module.exports = compare;