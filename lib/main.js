const sha1hex = require('crypto-sha1-hex');

const getLocations = async () => {
    const [locationShas] = await multiExecAsync(client, multi => {
        multi.smembers(redisK.locationS);
    });
    if (locationShas) {
        const locationRes = await multiExecAsync(client, multi => {
            locationShas.map(key => multi.hgetall(redisK.locationH(key)));
        });
        return locationShas.reduce((locations, key, index) => {
            const location = locationRes[index];
            locations[location.key] = location;
            return locations;
        }, {});
    }
    return {};
};

module.exports = async api => {
    const locations = await getLocations();
    const locationKeys = Object.keys(locations);
    logger.debug({locationKeys, locations});
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
        const locationKey = locationKeys.find(
            locationKey => url.startsWith(locationKey)
        );
        let key = url;
        if (locationKey) {
            const location = locations[locationKey];
            if (location.route === 'truncate') {
                key = locationKey;
            }
        }
        const sha = sha1hex(key);
        logger.debug({url, locationKey, sha});
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
