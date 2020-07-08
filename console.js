// vim: tw=120 softtabstop=4 shiftwidth=4

// this console can be used everywhere except before config is exported
// if config is not yet exported, cannot access properties config.DEBUG
// and config.logfile, so use another custom console or the native node
// console instead of this one.

const fs = require('fs')
const tracer = require('tracer');

const argv = require('./getArgv').getArgv();

const console_fmt = ("{{timestamp}} {{title}} "
                     + (argv.DEBUG ? "{{file}}:{{line}}{{space}} " : "")
                     + "{{message}}");

const console_config = {
    format : [ console_fmt ],
    dateformat: 'mmm dd HH:MM:ss',
    preprocess :  function(data){
        switch (data.title) {
            case 'debug': data.title = ' '; break;
            case 'log': data.title = ' '; break;
            case 'info': data.title = ' '; break;
            case 'warn': data.title = '!'; break;
            case 'error': data.title = '!!!!!'; break;
        }
        if (argv.DEBUG) data.space = " ".repeat(Math.max(0, 30 - `${data.file}:${data.line}`.length));
    }
};

if (argv.logfile) {
    const real_console = require('console');
    console_config.transport = (data) => {
        real_console.log(data.output);
        fs.open(argv.logfile, 'a', parseInt('0644', 8), function(e, id) {
            fs.write(id, data.output+"\n", null, 'utf8', function() {
                fs.close(id, () => { });
            });
        });
    }
}

exports.console = tracer.colorConsole(console_config);
