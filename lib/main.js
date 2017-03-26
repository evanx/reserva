const sha1hex = require('crypto-sha1-hex');

module.exports = async api => {
    const [locations] = await multiExecAsync(client, multi => {
        multi.smembers(redisK.locationS);
    });
    api.get('/*', async ctx => {
        const {host} = ctx.headers;
        const url = host + ctx.url;
        const location = locations.find(location => url.startsWith(location)) || url;
        const sha = sha1hex(location);
        logger.debug({url, location, sha});
        const [cachedContent, ttl, contentType] = await multiExecAsync(client, multi => {
            multi.get(redisK.content(sha));
            multi.ttl(redisK.content(sha));
            multi.hget(redisK.reqH(sha), 'contentType');
            multi.hincrby(redisK.hostA, host, 1);
        });
        if (cachedContent) {
            if (contentType) {
                ctx.set('content-type', contentType);
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
        const resContent = await client.brpopAsync(redisK.resQ(sha), config.resExpire);
        if (!resContent) {
            ctx.status = 504;
            ctx.body = { status: 504, url, sha };
        }
    });
    return true;
}
