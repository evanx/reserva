
set -u -e -x

  url=http://localhost:8032/test
  sha_localhost=334389048b872a533002b34d73f8c29fd09efc50
  sha=64fa9b2636719ef1a737811af2a2b7ef1fe91d17
  echo $sha
  echo -n $url | sha1sum
  redis-cli del reserva:location:s
  redis-cli del reserva:req:q
