var config = require('./config');
var util = require('util');
var ical = require('ical');
var moment = require('moment');
var request = require('request');
var _ = require('lodash');

//ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
parseData('',ical.parseFile('/home/jimshoe/dev/makerslocal/eventwitter/calendar.ics'));

setInterval(function(){
    console.log(util.format('Parsing ical @ %s\n', moment().format())); 
    parseData('',ical.parseFile('/home/jimshoe/dev/makerslocal/eventwitter/calendar.ics'));
    //ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
}, config.pollInt);      

function parseData(err, data){
  for (var k in data){
    if (data.hasOwnProperty(k)) {
      var ev = data[k]
      if (ev.type == "VEVENT" ){
        _.forEach(config.alertSchedule, function(alertSchedule) {
          scheduleAlert(ev, moment(ev.start).subtract(alertSchedule));
        });
      }
    }
  }
}

function scheduleAlert(ev, alertTime){
  var now = moment();
  if (alertTime > now && alertTime - config.pollInt < now) {
    var msg = genEventMsg(ev);
    setTimeout(function(){
      sendIrc(msg);
      sendTweet(msg);
    }, alertTime - now);      

  console.log(util.format('[DEBUG] - Schedule %s - "%s"',
      alertTime.format("LT"),
      msg));
  }
}

function genEventMsg(ev){
  var hour = moment().add(1, 'hour');
  var week = moment().add(1, 'week');
  var eventStart = moment(ev.start);
  var msg;

  if (eventStart.isBefore(hour)){
    return util.format('%s is starting right now! Check out %s for more info.',
                       ev.summary,
                       ev.url);
  }
  else if (eventStart.isBefore(week)){
    return util.format('%s is starting %s. Check out %s for more info.',
                       ev.summary,
                       eventStart.calendar(),
                       ev.url);
  }
  else {
    return util.format('%s is starting on %s Check out %s for more info.',
                       ev.summary,
                       eventStart.format("l [at] LT"),
                       ev.url);
  }
}

function sendIrc(msg){
  console.log("[DEBUG] - Sending irc   - "+msg);
  var post_data = JSON.stringify({
      'message' : msg,
      'channel': config.rq.channel,
      'isaction': config.rq.isaction,
      'key' : config.rq.key
  });

  request.post(
      { headers:{'Content-Type' : 'application/json'},
        url:'https://restirc.tylercrumpton.com/relay',
        body: post_data
      },
      function (error, response, body) {
        console.log(response.statusCode);
      } 
  );
}

function sendTweet(msg){
  console.log("[DEBUG] - Sending tweet - "+msg);
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
