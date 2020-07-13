// vim: tw=120 softtabstop=4 shiftwidth=4

const assert = require('assert');

const { getNewArgvNoZero } = require('./module_loading/getNewArgvNoZero');
const { pushArgsInProcessArgv } = require('./module_loading/pushArgsInProcessArgv');
const { removeProcessArgvIndexTwoAndHigherElements } = require('./module_loading/removeProcessArgvIndexTwoAndHigherElements');
const { stub_console } = require('./utils/stub_console');

let argv;

describe('process.argv to yargs.argv', () => {

    /* process.argv sample as of july 2020
    ["/home/amd2020/.nvm/versions/node/v14.2.0/bin/node","/home/amd2020/gtp2ogs/gtp2ogs.js","--beta","--apikey",
    "someapikey","--username","someuser","--persist","--noclock","--debug",
    "--greetingbotcommand","--komis","7.5,automatic","--minmaintimeblitzranked","7","--rejectnew","--",
    "/home/amd2020/sai/build/sai-0.17-d2c82fc0","--gtp","-w","/home/amd2020/networks/sai/9b/e1eab1d6_1913000.gz",
    "--noponder","-v","400","--symm","-r","-1","--lambda","1.0","--mu","0"]
    */

    /* yargs.argv sample as of july 2020
    {
        _: [
            '/home/amd2020/sai/build/sai-0.17-d2c82fc0',
            '--gtp',
            '-w',
            '/home/amd2020/networks/sai/9b/e1eab1d6_1913000.gz',
            '--noponder',
            '-v',
            '400',
            '--symm',
            '-r',
            '-1',
            '--lambda',
            '1.0',
            '--mu',
            '0'
        ],
        beta: true,
        apikey: 'someapikey',
        username: 'username',
        persist: true,
        noclock: true,
        debug: true,
        greetingbotcommand: true,
        komis: '7.5,automatic',
        minmaintimeblitzranked: 7,
        rejectnew: true,
        rejectnewmsg: 'Currently, this bot is not accepting games, try again later',
        host: 'online-go.com',
        port: 443,
        startupbuffer: 5,
        timeout: 0,
        maxconnectedgames: 20,
        maxconnectedgamesperuser: 3,
        '$0': 'gtp2ogs.js'
    }
    */

    beforeEach(function() {
        // stub console before logging anything else
        stub_console();

        removeProcessArgvIndexTwoAndHigherElements();
    });
    
    it('get argv from process.argv in yargs.argv', () => {
        const args = ["--username", "testbot", "--apikey", "deadbeef", "--host", "80", "--debug",
        "--", "gtp-program", "--argument"];
        pushArgsInProcessArgv(args);

        argv = getNewArgvNoZero();

        const expectedYargsArgv = {
            username: "testbot",
            apikey: "deadbeef",
            host: 80,
            debug: true,
            // defaults inputted in getArgv.js
            maxconnectedgames: 20,
            maxconnectedgamesperuser: 3,
            port: 443,
            rejectnewmsg: "Currently, this bot is not accepting games, try again later",
            startupbuffer: 5,
            timeout: 0,
            // bot command
            _: ["gtp-program", "--argument"]
        };

        assert.deepEqual(argv, expectedYargsArgv);
    });

});