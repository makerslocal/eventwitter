module.exports = {
  pollInt : 60 * 60 * 1000, // 1 hour

  alertSchedule : [
    { hour  : 0 },
    { hour  : 1 },
    { day   : 1 },
    { week  : 1 }
  ],

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

