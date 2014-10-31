var util = require('util')
var ical = require('ical')
var moment = require('moment')
var request = require('request');

// 1 Hour
var pollInt = 60 * 60 * 1001;

//ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
parseData('',ical.parseFile('/home/jimshoe/dev/makerslocal/node_ical_twitter/calendar.ics'));

setInterval(function(){
    console.log(util.format('Parsing ical @ %s\n', moment().format())); 
    parseData('',ical.parseFile('/home/jimshoe/dev/makerslocal/node_ical_twitter/calendar.ics'));
    //ical.fromURL('http://256.makerslocal.org/calendar.ics', {}, parseData);
}, pollInt);      

function parseData(err, data){
  for (var k in data){
    if (data.hasOwnProperty(k)) {
      var ev = data[k]
      if (ev.type == "VEVENT" ){
        var alertTimes = [
            moment(ev.start), 
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
}

function scheduleAlert(ev, alertTime){
  var now = moment();
  if (alertTime > now && alertTime - pollInt < now) {
    console.log(util.format('[DEBUG] - Schedule "%s" - "%s"',
      alertTime.format("LT"),
      genEventMsg(ev)));
     
    setTimeout(function(){
      var msg = genEventMsg(ev);
      sendIrc(msg);
      sendTweet(msg);
    }, alertTime - now);      
  }
}

function genEventMsg(ev){
  var msg = util.format('%s will be happending %s. Check out %s for more info.',
    ev.summary,
    moment(ev.start).format("dddd [at] LT"),
    ev.url);

  return msg
}

function sendIrc(msg){
  console.log("[DEBUG] - Sending irc - "+msg);
  var post_data = JSON.stringify({
      'message' : msg,
      'channel': '##rqtest',
      'isaction': false,
      'key' : '13371234'
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
  console.log("[DEBUG] - Sending tweet");
  console.log(msg);
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
