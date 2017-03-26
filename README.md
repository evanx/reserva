# reserva

Redis-based web gateway/proxy.

<img src='https://raw.githubusercontent.com/evanx/reserva/master/docs/readme/images/main2.png'>

- HTTP request URLs are SHA'ed i.e. `ctx.headers.host + ctx.url`
- if cached content is found in Redis is returned e.g. `reserva:${sha}:t`
- else the request SHA is pushed to a queue `reserva:req:q`
- we await a response via `reserva:${sha}:res:q` with `config.resTimeout`
- if `brpop` times out, we return `504` i.e. "Gateway timeout"
- another service can reactively generate content and push to this Redis list

Additionally a set of locations can be specified, where if the request URL starts with that (truncated) location, then that is used for the SHA, e.g. to serve static or cached content from Redis.


## Test

```
git clone git@github.com:evanx/reserva.git
cd reserva
npm install
npm run test
```


## Configuration

See `lib/spec.js` https://github.com/evanx/reserva/blob/master/lib/spec.js

```javascript
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
},
reqExpire: {
    description: 'the TTL expiry for HTTP requests',
    unit: 's',
    default: 4
},
resExpire: {
    description: 'the TTL expiry for HTTP responses',
    unit: 's',
    default: 15
},
httpPort: {
    description: 'the HTTP port',
    default: 8032
},
httpLocation: {
    description: 'the HTTP location',
    default: ''
},
```
Our `spec` also exposes the Redis keys used by this service:
```javascript    
reqQ: {
    key: `${config.redisNamespace}:req:q`
},
reqC: {
    key: `${config.redisNamespace}:req:c`
},
locationS: {
    key: `${config.redisNamespace}:location:s`
},
reqH: {
    key: sha => `${config.redisNamespace}:${sha}:h`
},
resQ: {
    key: sha => `${config.redisNamespace}:${sha}:res:q`
},
content: {
    key: sha => `${config.redisNamespace}:${sha}:t`
},
serviceA: {
    key: `${config.redisNamespace}:a`
},
errorA: {
    key: `${config.redisNamespace}:error:a`
},
hostA: {
    key: `${config.redisNamespace}:host:a`
}
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
api.get('/*', async ctx => {
    const {host} = ctx.headers;
    const url = host + ctx.url.replace(/\/$/, '');
    const location = locations.find(location => url.startsWith(location)) || url;
    const sha = sha1hex(location);
    const [
        cachedContent,
        cachedTtl,
        cachedContentType
    ] = await multiExecAsync(client, multi => {
        multi.get(redisK.contentT(sha));
        multi.ttl(redisK.contentT(sha));
        multi.hget(redisK.reqH(sha), 'contentType');
        multi.hincrby(redisK.serviceA, 'req', 1);
        multi.hincrby(redisK.hostA, host, 1);
    });
    ...
});
```
When no cached content is found, we push
```javascript
await multiExecAsync(client, multi => {
    multi.hmset(redisK.reqH(sha), {url});
    multi.expire(redisK.reqH(sha), config.reqExpire);
    multi.lpush(redisK.reqQ, sha);
});
```
We await for a response to be pushed onto a list:
```javascript
const popRes = await client.brpopAsync(redisK.resQ(sha), config.reqExpire);
```
where actually this is not a queue per se, but we wish to await the blocking pop.


### Archetype

See `lib/index.js` is application archetype: https://github.com/evanx/redis-koa-app
```
require('redis-koa-app')(
    require('../package.json'),
    require('./spec.js'),
    async deps => Object.assign(global, deps),    
    () => require('./main.js')
);
```

<hr>

https://twitter.com/@evanxsummers
