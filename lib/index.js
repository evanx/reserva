require('redis-koa-app')(
    require('../package.json'),
    require('./spec.js'),
    async deps => Object.assign(global, deps),
    () => require('./main.js')
);
