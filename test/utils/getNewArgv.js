function getNewArgv() {
    return {
        apikey: 'deadbeef',
        host: 'test',
        port: 80,
        username: 'testbot',
        _: ['gtp-program', '--argument'],
    };
}

exports.getNewArgv = getNewArgv;
