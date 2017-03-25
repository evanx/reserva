
set -u -e

  pattern=reserva:* command=del rescan
  redis-cli del reserva:req:q
  redis-cli del reserva:busy:q
  redis-cli del reserva:1:req:h
  redis-cli hset reserva:1:req:h text 'another test message'
  redis-cli lpush reserva:req:q 1
  redis-cli lpush reserva:req:q exit
  #slackUrl=http://localhost:8031 npm start
  slackUrl=$SLACK_URL slackUsername=SqueakyMonkeyBot npm start
  scanCount=1000 format=terse pattern=reserva:* format=key rescan
  scanCount=1000 format=terse pattern=reserva:*:q command=llen rescan
  scanCount=1000 format=terse pattern=reserva:*:h command=hgetall rescan
