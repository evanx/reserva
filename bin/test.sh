
set -u -e

alias curl="curl -s -w '\n'"

c0localhost() {
    sha=334389048b872a533002b34d73f8c29fd09efc50
}

  url=localhost:8032/test
  sha=64fa9b2636719ef1a737811af2a2b7ef1fe91d17
  echo $sha
  echo -n $url | sha1sum | cut -b1-40
  redis-cli del reserva:location:s
  redis-cli del reserva:req:q
  redis-cli del reserva:$sha:res:q
  redis-cli setex reserva:$sha:t 4 'Right'
  redis-cli get reserva:$sha:t
  redis-cli keys 'reserva:*'
  (
    sleep 1
    curl $url
    redis-cli del reserva:$sha:t
    redis-cli lpush reserva:$sha:res:q 'Indeed'
    redis-cli lrange reserva:$sha:res:q 0 0
    curl $url
    curl localhost:8032/shutdown
  ) & npm start
  echo OK
