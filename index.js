var util = require('util');

var _ = require('lodash');
var format = require("string-template");
var ical = require('ical');
var log = require('logule').init(module);
var moment = require('moment');
var request = require('request');
var twitter = require('twitter');

var config = require('./config');

parseiCalFeed();

setInterval(function(){
  parseiCalFeed();
}, config.pollInt); 

function parseiCalFeed(){
  log.info('Parse ical file');
  //ical.fromURL(config.icalurl, {}, parseiCalData);
  parseiCalData('',ical.parseFile('/home/jimshoe/dev/makerslocal/eventwitter/calendar.ics'));
}

function parseiCalData(err, data){
  if(err){ 
    log.info(err);
    return; 
  }
  _.forEach(data, function(ev) {
      if (ev.type == "VEVENT" ){
        _.forEach(config.alertSchedule, function(alertSchedule) {
          scheduleAlert(ev, moment(ev.start).subtract(alertSchedule));
        });
      }
  });
}

function scheduleAlert(ev, alertTime){
  var now = moment();
  if (alertTime > now && alertTime - config.pollInt < now) {
    var msg = genEventMsg(ev);
    setTimeout(function(){
      if (config.enableIrc) sendIrc(msg);
      if (config.enableTwitter) sendTweet(msg);
    }, alertTime - now);      

  log.info('Schduled message: %j', {message: msg, alertime: alertTime.format('LLL')});
  }
}

function genEventMsg(ev){
  var hour = moment().add(1, 'hour');
  var week = moment().add(1, 'week');
  var eventStart = moment(ev.start);
  var eventEnd = moment(ev.end);

  if (eventStart.isBefore(hour)){
    return format(_.sample(config.alertMessages.now), {
                  summary     : ev.summary,
                  url         : ev.url,
                  start       : eventStart.calendar(),
                  end         : ev.end,
                  location    : ev.location,
                  description : ev.description
                  });
  }
  else if (eventStart.isBefore(week)){
    return format(_.sample(config.alertMessages.week), {
                  summary     : ev.summary,
                  url         : ev.url,
                  start       : eventStart.calendar(),
                  end         : eventEnd.calendar(),
                  location    : ev.location,
                  description : ev.description
                  });
  }
  else {
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

function sendIrc(msg){
  log.info('IRC message: %j', {message: msg});
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
        log.info('Redqueen response', {response : response.statusCode});
      } 
  );
}

function sendTweet(msg){
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
