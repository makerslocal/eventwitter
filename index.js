var util = require('util');

var _ = require('lodash');
var format = require("string-template");
var ical = require('ical');
var log = require('logule').init(module);
var moment = require('moment');
var request = require('request');
var twitter = require('twitter');

// Load config file
var config = require('./config');

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
    log.info(err);
    return; 
  }
  _.forEach(data, function(ev) {
    if (ev.type == "VEVENT" ){
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
    var msg = GenEventMsg(ev);
    setTimeout(function(){
      SendIrc(msg);
      SendTweet(msg);
    }, alertTime - now);      

  log.info('Schduled message: %j', {message: msg, alertime: alertTime.format('LLL')});
  }
}

// Pick random string and generate message.
function GenEventMsg(ev){
  var hour = moment().add(1, 'hour');
  var week = moment().add(1, 'week');
  var eventStart = moment(ev.start);
  var eventEnd = moment(ev.end);

  // Get message based on alerting happening now
  if (eventStart.isBefore(hour)){
    // _.smaple picks one random item from an array
    return format(_.sample(config.alertMessages.now), {
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
    return format(_.sample(config.alertMessages.week), {
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
    return format(_.sample(config.alertMessages.longer),{
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
function SendIrc(msg){
  if (!config.rq.enable) {
    return;
  }
  log.info('IRC message: %j', {message: msg});
  var postData = JSON.stringify({
      'message' : msg,
      'channel': config.rq.channel,
      'isaction': config.rq.isaction,
      'key' : config.rq.key
  });

  request.post(
      { headers:{'Content-Type' : 'application/json'},
        url: config.rq.url,
        body: postData
      },
      function (error, response, body) {
        log.info('Redqueen response', {response : response.statusCode});
      } 
  );
}

// Send Tweet message.  Called from timeout in ScheduleAlert.
function SendTweet(msg){
  if (!config.twitter.enable) {
    return;
  }
  log.info('Twitter message: %j', {message: msg});
  var twit = new twitter({
        consumer_key: config.twitter.consumer_key,
        consumer_secret: config.twitter.consumer_secret,
        access_token_key: config.twitter.access_token_key,
        access_token_secret: config.twitter.access_token_secret
  });
  twit.updateStatus(msg, function (data) {
    log.info('Twitter response', {response : util.inspect(data)});
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
