var util       = require('util');

var _          = require('lodash');
var format     = require("string-template");
var ical       = require('ical');
var log        = require('logule').init(module);
var moment     = require('moment');
var PushBullet = require('pushbullet');
var request    = require('request');
var twitter    = require('twitter');

var config     = require('./config');

// Initial Parse of ical feed
ParseiCalFeed();

// Parse ical feed at set interval
setInterval(function(){
  ParseiCalFeed();
}, config.pollInt); 

// Parse ical feed, and send data off
function ParseiCalFeed(){
  log.info('Parse ical file');
  //ical.fromURL(config.icalurl, {}, ParseiCalData);
  ParseiCalData('',ical.parseFile('/home/jimshoe/dev/makerslocal/eventwitter/calendar.ics'));
}

// Parse events looking for the VEVENT type, send each to be scheduled if needed
function ParseiCalData(err, data){
  if(err){ 
    log.error(err);
    return; 
  }
  _.forEach(data, function(ev) {
    if (ev.type === "VEVENT" ){
      _.forEach(config.alertSchedule, function(alertSchedule) {
        ScheduleAlert(ev, moment(ev.start).subtract(alertSchedule));
      });
    }
  });
}

// Determine if ivents needs to be scheduled, and do it.
function ScheduleAlert(ev, alertTime){
  var now = moment();
  var isAlertable = (alertTime > now && alertTime - config.pollInt < now);
  if (isAlertable) {
    setTimeout(function(){
      SendToIrc(ev);
      SendToTweet(ev);
      SendToPushbullet(ev);
    }, alertTime - now);      

    log.info('Schduled message: %j', {ev: ev.summary, alertime: alertTime.format('LLL')});
  }
}

// Pick random string and generate message.
function GenEventMsg(message, ev){
  var hour       = moment().add(1, 'hour');
  var week       = moment().add(1, 'week');
  var eventStart = moment(ev.start);
  var eventEnd   = moment(ev.end);

  // Get message based on alerting happening now
  if (eventStart.isBefore(hour)){
    // _.smaple picks one random item from an array
    return format(_.sample(message.now), {
                  summary     : ev.summary,
                  url         : ev.url,
                  start       : eventStart.calendar(),
                  end         : ev.end,
                  location    : ev.location,
                  description : ev.description
                  });
  }
  // Get message based on alerting happening within a week
  else if (eventStart.isBefore(week)){
    // _.smaple picks one random item from an array
    return format(_.sample(message.week), {
                  summary     : ev.summary,
                  url         : ev.url,
                  start       : eventStart.calendar(),
                  end         : eventEnd.calendar(),
                  location    : ev.location,
                  description : ev.description
                  });
  }
  // Get message based on alerting happening after a week
  else {
    // _.smaple picks one random item from an array
    return format(_.sample(message.longer),{
                  summary     : ev.summary,
                  url         : ev.url,
                  start       : eventStart.format("l [at] LT"),
                  end         : eventEnd.format("l [at] LT"),
                  location    : ev.location,
                  description : ev.description
                  });
  }
}

// Send IRC message.  Called from timeout in ScheduleAlert.
function SendToIrc(ev){
  var rq = config.redqueen;
  if (!rq.enable) { return; }
  var msg = GenEventMsg(rq.messages, ev);
  var postData = JSON.stringify({
      'message'  : msg,
      'channel'  : rq.channel,
      'isaction' : rq.isaction,
      'key'      : rq.key
  });

  log.info('IRC message: %j', {message: msg});
  request.post(
      { headers:{'Content-Type' : 'application/json'},
        url: rq.url,
        body: postData
      },
      function (error, response, body) {
        if (response.statusCode != '200'){ 
          log.error(util.inspect(response));
        }
      } 
  );
}

// Send Tweet message.  Called from timeout in ScheduleAlert.
function SendToTweet(ev){
  var tw = config.twitter;
  if (!tw.enable) { return; }
  var msg = GenEventMsg(tw.messages, ev);
  var twit = new twitter({
        consumer_key        : tw.consumer_key,
        consumer_secret     : tw.consumer_secret,
        access_token_key    : tw.access_token_key,
        access_token_secret : tw.access_token_secret
  });
  log.info('Twitter message: %j', {message: msg});
  twit.updateStatus(msg, function (data) {
    if (!data.id){
      log.error(util.inspect(data));
    }
  });
}

function SendToPushbullet(ev){
  var push = config.pushbullet;
  var pusher = new PushBullet(push.api_key);
  var msg = GenEventMsg(push.messages, ev);
  pusher.note(push.target, 'Event', msg, function(error, response) {
    if (error) { log.error(error); }
    log.info(response);
  });
}

// A little debuging
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
