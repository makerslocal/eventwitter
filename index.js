var util = require('util')
var ical = require('ical')
var moment = require('moment')

//ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
parseData('',ical.parseFile('/home/jimshoe/dev/makerslocal/node_ical_twitter/calendar.ics'));

setInterval(function(){
    ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
}, 60 * 60 * 1000);      

function parseData(err, data){
  for (var k in data){
    if (data.hasOwnProperty(k)) {
      var ev = data[k]
      var alertTimes = [
          moment(ev.start).subtract(1, 'hour'), 
          moment(ev.start).subtract(1, 'day'),
          moment(ev.start).subtract(7, 'day')
          ]
      for (i = 0; i < alertTimes.length; i++) { 
        scheduleAlert(ev, alertTimes[i]);
      }
    }
  }
}

function scheduleAlert(ev, alertTime){
  if (ev.type == "VEVENT" && (alertTime > moment() && alertTime.subtract(1, 'hour') < moment())) {
    printEvent(ev);
  }
}

function printEvent(ev){
  console.log(util.format('%s\n\t%s\n\t%s\n\t%s\n\t%s\n\t%s\n\t%s\n', 
    ev.summary,
    ev.url,
    ev.start,
    ev.end,
    ev.location,
    ev.uid,
    ev.description));
}
