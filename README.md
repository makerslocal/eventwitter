# Summary
Nodejs script to tweet and redqueen messages from Makers Local 256  ical feed.

## Configure
Move config.js.dist to config.js, then edit 'rq' and 'twitter' sections with your information.

## Run
* ```node index /config/path```
* ```docker run -v $(pwd)/config.js:/config.js -v /etc/localtime:/etc/localtime:ro -d --name="eventwitter" eventwitter /config.js```

## TODO
* ~~Schedule alerts~~
* ~~Send to RedQueen~~
* ~~Send to twitter~~
* ~~Config parameter to enable/disable msg updates.~~
* ~~Better logging~~
* Auto-reload config file
* Unit tests
* Package it up
