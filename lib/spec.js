module.exports = pkg => ({
    description: pkg.description,
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
        },
        reqExpire: {
            description: 'the TTL expiry for HTTP request',
            unit: 's',
            default: 4
        },
        resExpire: {
            description: 'the TTL expiry for HTTP response',
            unit: 's',
            default: 4
        },
        errorExpire: {
            description: 'the TTL expiry for error details',
            unit: 's',
            default: 366611
        },
        httpPort: {
            description: 'the HTTP port',
            default: 8032
        },
        httpLocation: {
            description: 'the HTTP location',
            default: ''
        },
        loggerLevel: {
            description: 'the logging level',
            options: ['debug', 'info', 'warn', 'error'],
            defaults: {
                production: 'info',
                test: 'debug',
                development: 'debug'
            }
        }
    },
    redisK: config => ({
        reqQ: {
            key: `${config.redisNamespace}:req:q`
        },
        reqC: {
            key: `${config.redisNamespace}:req:c`
        },
        locationH: {
            key: `${config.redisNamespace}:location:h`
        },
        reqH: {
            key: sha => `${config.redisNamespace}:${sha}:h`
        },
        resQ: {
            key: sha => `${config.redisNamespace}:${sha}:res:q`
        },
        contentT: {
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
        },
    })
});
