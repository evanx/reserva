# reserva

Redis-based web gateway.

<img src='https://raw.githubusercontent.com/evanx/reserva/master/docs/readme/images/main.png'>


## Use case


## Configuration

See `lib/spec.js` https://github.com/evanx/reserva/blob/master/lib/spec.js

```javascript
    env: {
        redisHost: {
            description: 'the Redis host',
            default: 'localhost'
        },
        redisPort: {
            description: 'the Redis port',
            default: 6379
        },
        redisNamespace: {
            description: 'the Redis namespace',
            default: 'reserva'
        }
    }
```
Our `spec` also exposes the Redis keys used by this service:
```javascript    
    redisK: config => ({
        reqS: {
            key: `${config.redisNamespace}:req:s`
        },
        reqQ: {
            key: `${config.redisNamespace}:req:q`
        },
        reqH: {
            key: sha => `${config.redisNamespace}:${sha}:req:h`
        },
        busyQ: {
            key: `${config.redisNamespace}:busy:q`
        },
        reqC: {
            key: `${config.redisNamespace}:req:count:h`
        },
        errorC: {
            key: `${config.redisNamespace}:error:count:h`
        }
    })
```

## Docker

See `Dockerfile` https://github.com/evanx/reserva/blob/master/Dockerfile
```
FROM mhart/alpine
ADD package.json .
RUN npm install --silent
ADD lib lib
ENV NODE_ENV production
CMD ["node", "lib/index.js"]
```

We can build as follows:
```shell
docker build -t reserva https://github.com/evanx/reserva.git
```
where the image is tagged as `reserva`

Then for example, we can run on the host's Redis as follows:
```shell
docker run --network=host -e reserva
```

Note `--network-host` connects the container to your `localhost` bridge. The default Redis host `localhost` works in that case.

Since the containerized app has access to the host's Redis instance, you should inspect the source.


## Implementation

See `lib/main.js` https://github.com/evanx/reserva/blob/master/lib/main.js
```javascript
```

Uses application archetype: https://github.com/evanx/redis-koa-app

<hr>

https://twitter.com/@evanxsummers
