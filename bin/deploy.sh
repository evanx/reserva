
  name=`basename $PWD`
  git pull
  docker build -t $name .
  docker rm -f $name
  docker run --network=host -d --name $name --restart unless-stopped -e NODE_ENV=$NODE_ENV $name
  docker logs -f $name
