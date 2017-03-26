const sha1hex = require('crypto-sha1-hex');

module.exports = async api => {
    const [locationHashes] = await multiExecAsync(client, multi => {
        multi.hgetall(redisK.locationH);
    });
    const locations = locationHashes? Object.keys(locationHashes) : [];
    if (process.env.NODE_ENV !== 'production') {
        api.get('/shutdown', async ctx => {
            logger.warn('shutdown', ctx.url);
            setTimeout(() => process.exit(0), 100);
            ctx.body = `OK ${ctx.url}`;
            return;
        });
    }
    api.get('/*', async ctx => {
        const {host} = ctx.headers;
        const url = host + ctx.url.replace(/\/$/, '');
        const location = locations.find(location => url.startsWith(location)) || url;
        const sha = sha1hex(location);
        logger.debug({url, location, sha});
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
        if (cachedContent) {
            if (cachedContentType) {
                ctx.set('content-type', cachedContentType);
            }
            ctx.body = cachedContent;
            return;
        }
        await multiExecAsync(client, multi => {
            multi.del(redisK.reqH(sha));
            multi.hmset(redisK.reqH(sha), {
                url,
                sha
            });
            multi.expire(redisK.reqH(sha), config.reqExpire);
            multi.lpush(redisK.reqQ, sha);
            multi.publish(redisK.reqC, sha);
        });
        const popRes = await client.brpopAsync(redisK.resQ(sha), config.reqExpire);
        if (!popRes) {
            await multiExecAsync(client, multi => {
                multi.hincrby(redisK.serviceA, '504', 1);
            });
            ctx.status = 504;
            ctx.body = `Gateway timeout ${url} ${sha}`;
            return;
        }
        const content = popRes[1];
        const [contentType] = await multiExecAsync(client, multi => {
            multi.hget(redisK.reqH(sha), 'contentType');
            multi.hincrby(redisK.serviceA, '200', 1);
        });
        if (contentType) {
            logger.debug({contentType});
            ctx.set('content-type', contentType);
        }
        ctx.body = content;
    });
    return true;
}
