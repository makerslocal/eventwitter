module.exports = {
  enableIrc : true,
  enableTwitter: false,

  pollInt : 60 * 60 * 1000, // 1 hour

  alertSchedule : [ // http://momentjs.com/docs/#/parsing/defaults/
    { hour  : 0 },
    { hour  : 1 },
    { day   : 1 },
    { week  : 1 }
  ],

  alertMessages : {
    // summary     : Event name
    // url         : Url to wiki page
    // start       : Event start time
    // end         : Event end time
    // location    : Event location, though most times it is undefined
    // description : Event description, most times its the same as url

    // alert msg for right now
    now : [
      "{summary} is starting right now! Check out {url} for more info.", 
      "Better hurry up, {summary} is starting right now. {url}"
    ],

    // alert msg within the week, time in moment.calendar format
    week : [       
      "{summary} is happening {start}. Check out {url} for more info.",
      "It's all happening! {summary} will start {start}. Visit {url} for more info."
    ],

    // alert msg for longer than a longer than a week, time in moment.format("l [at] LT") format              
    longer : [ 
      "{summary} is happening on {start}. Check out {url} for more info."
    ]
  },

  rq : {
    channel  : '##rqtest',
    isaction : false,
    key      : '13371234'
  }, 
  
  twitter : {
    consumer_key        : '',
    consumer_secret     : '',
    access_token_key    : '',
    access_token_secret : ''
  }

};

