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
        },
        popDelay: {
            description: 'pop delay',
            unit: 'ms',
            default: 2000
        },
        popTimeout: {
            description: 'pop timeout',
            unit: 'ms',
            default: 2000
        }
    },
    redisK: config => ({
        reqQ: {
            key: `${config.redisNamespace}:req:q`
        },
        reqC: {
            key: `${config.redisNamespace}:req:c`
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
        hostA: {
            key: `${config.redisNamespace}:req:count:h`
        },
        errorA: {
            key: `${config.redisNamespace}:error:count:h`
        }
    })
});
