function getNewArgvReset() {
    return {
        apikey: 'deadbeef',
        host: 'test',
        port: 80,
        username: 'testbot',
        _: ['gtp-program', '--argument'],
    };
}

exports.getNewArgvReset = getNewArgvReset;
