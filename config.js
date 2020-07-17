// vim: tw=120 softtabstop=4 shiftwidth=4

// see: https://github.com/online-go/gtp2ogs/blob/devel/docs/DEV.md#no-console-eslint-rule-in-configjs
/* eslint-disable no-console */

const fs = require('fs');

const { getArgNamesGRU } = require('./options/getArgNamesGRU');
const { getOptionName } = require('./options/getOptionName');
const { getRankedUnranked } = require('./options/getRankedUnranked');
const { getRankedUnrankedUnderscored } = require('./options/getRankedUnrankedUnderscored');

const { droppedOptions, ogsPvAIs, rankedUnrankedOptions } = require('./constants');

exports.check_rejectnew = function() {};

exportAllowedGroupInitialConfig("");
exportAllowedGroupInitialConfig("_ranked");
exportAllowedGroupInitialConfig("_unranked");

exports.updateFromArgv = function(argv) {
    // console messages
    // A- greeting and debug status

    const debugStatus = argv.debug ? "DEBUG: ON\n" : "";
    console.log(`\ngtp2ogs version 6.0.1`
                + `\n--------------------`
                + `\n- For changelog or latest devel updates, `
                + `please visit https://github.com/online-go/gtp2ogs/tree/devel\n`
                + `${debugStatus}`);

    // B - test unsupported argv

    testBotCommandArgvIsValid(argv);
    testDroppedArgv(droppedOptions, argv);
    testConflictingOptions("rankedonly", "unrankedonly", argv);
    testConflictingOptions("persist", "persistnoncorr", argv);
    ensureSupportedOgspvAI(argv.ogspv, ogsPvAIs);
    testRankedUnrankedOptions(rankedUnrankedOptions, argv);

    // C - set general/ranked/unranked options defaults
    
    // For general/ranked/unranked options, do not add a default using .default of yargs, add it later in the
    // code if no ranked arg nor unranked arg are used, else we would be force using the general arg regardless of
    // botadmin using the ranked and/or unranked arg(s), triggering the no 3 args at the same time error.

    setRankedUnrankedOptionsDefaults(rankedUnrankedOptions, argv);

    // EXPORTS FROM ARGV
    // 0) Export everything in argv first

    for (const k in argv) {
        exports[k] = argv[k];
    }

    // 1) Add and Modify/Adjust exports

    if (argv.debug) {
        exports.DEBUG = true;
    }
    if (argv.logfile && typeof argv.logfile === "boolean") {
        exports.logfile = `gtp2ogs_logfile_${new Date().toISOString()}`;
    }
    exportMicroseconds("timeout", argv);
    exportMicroseconds("startupbuffer", argv);

    if (argv.beta) {
        exports.host = 'beta.online-go.com';
    }

    exportNoAutoHandicapIfMinHandicapIsPositive("", argv);
    exportNoAutoHandicapIfMinHandicapIsPositive("ranked", argv);
    exportNoAutoHandicapIfMinHandicapIsPositive("unranked", argv);
    
    if (argv.ogspv) {
        exports.ogspv = argv.ogspv.toUpperCase();
    }
    if (argv.rejectnew) {
        // A bot never accepting new games shouldn't be appearing in the dropdown, polite to our users.
        exports.hidden = true;
    }
    exports.check_rejectnew = function()
    {
        if (argv.rejectnew)  return true;
        if (argv.rejectnewfile && fs.existsSync(argv.rejectnewfile))  return true;
        return false;
    };
    exports.bot_command = argv._;

    // 2) specific ranked/unranked options exports

    processRankExport("minrank", argv);
    processRankExport("minrankranked", argv);
    processRankExport("minrankunranked", argv);

    processRankExport("maxrank", argv);
    processRankExport("maxrankranked", argv);
    processRankExport("maxrankunranked", argv);

    processBansExport("bans", argv);
    processBansExport("bansranked", argv);
    processBansExport("bansunranked", argv);

    processBoardsizesExport("boardsizes", argv);
    processBoardsizesExport("boardsizesranked", argv);
    processBoardsizesExport("boardsizesunranked", argv);

    processKomisExport("komis", argv);
    processKomisExport("komisranked", argv);
    processKomisExport("komisunranked", argv);

    processAllowedGroupExport("speeds", argv);
    processAllowedGroupExport("speedsranked", argv);
    processAllowedGroupExport("speedsunranked", argv);

    processAllowedGroupExport("timecontrols", argv);
    processAllowedGroupExport("timecontrolsranked", argv);
    processAllowedGroupExport("timecontrolsunranked", argv);

    // console messages
    // C - test exports warnings

    warnIfNopauseIsMissing("ranked");
    warnIfNopauseIsMissing("unranked");
    console.log("\n");

}

function exportAllowedGroupInitialConfig(rankedUnranked) {
    exports[`banned_users${rankedUnranked}`] = {};
    exports[`allow_all_boardsizes${rankedUnranked}`] = false;
    exports[`allowed_boardsizes${rankedUnranked}`] = [];
    exports[`allow_all_komis${rankedUnranked}`] = false;
    exports[`allowed_komis${rankedUnranked}`] = [];
    exports[`allowed_speeds${rankedUnranked}`] = {};
    exports[`allow_all_speeds${rankedUnranked}`] = false;
    exports[`allowed_timecontrols${rankedUnranked}`] = {};
    exports[`allow_all_timecontrols${rankedUnranked}`] = false;
}

function testRankedUnrankedOptions(rankedUnrankedOptions, argv) {
    for (const option of rankedUnrankedOptions) {
        const [general, ranked, unranked] = getArgNamesGRU(option.name);
        
        // check undefined specifically to handle valid values such as 0 or null which are tested false
        if (argv[general] !== undefined) {
            if (argv[ranked] !== undefined) {
                throw `Cannot use --${general} and --${ranked} at the same time.\nFor ranked games, `
                      + `use either --${general} or --${ranked} or no option if you want to allow all values.`;
            }
            if (argv[unranked] !== undefined) {
                throw `Cannot use --${general} and --${unranked} at the same time.\nFor unranked games, `
                      + `use either --${general} or --${unranked} or no option if you want to allow all values.`;
            }
        }
    }
}

function testBotCommandArgvIsValid(argv) {
    if (argv._ === undefined) {
        throw "Missing bot command.";
    }

    const parsedBotCommand = JSON.stringify(argv._);

    if (!Array.isArray(argv._)) {
        throw `Bot command (detected as ${parsedBotCommand}) was not correctly parsed as an array of parameters`
              + `, please check your syntax ( -- ).`;
    }
    if (argv._.length === 0) {
        throw `Bot command (detected as ${parsedBotCommand}) cannot be empty, please use at least one element`
              + ` in your bot command which should be the AI executable (ex: lz.exe).`;
    }
}

function testDroppedArgv(droppedOptions, argv) {
    for (const [oldNames, newName] of droppedOptions) {
        for (const oldName of oldNames) {
            if (argv[oldName]) {
                if (newName !== undefined) throw `Dropped: --${oldName} is no longer supported, use --${newName} instead.`;
                throw `Dropped: --${oldName} is no longer supported.`;
            }
        }
    }
    for (const argName of getArgNamesGRU("komis")) {
        if (argv[argName]) {
            for (const komi of ["auto","null"]) {
                if (argv[argName].split(",").includes(komi)) {
                    throw `Dropped: --${argName} ${komi} is no longer `
                                + `supported, use --${argName} automatic instead`;
                }
            }
        }
    }
}

function testConflictingOptions(optionNameFirst, optionNameSecond, argv) {
    if (argv[optionNameFirst] && argv[optionNameSecond]) {
        throw `Please choose either --${optionNameFirst} or --${optionNameSecond}, not both.`;
    }
}

function ensureSupportedOgspvAI(ogspv, ogsPvAIs) {
    // being case tolerant
    if (!ogspv) return;
    const upperCaseOgsPv = ogspv.toUpperCase();
    const upperCaseAIs   = ogsPvAIs.map(e => e.toUpperCase());

    if (!upperCaseAIs.includes(upperCaseOgsPv)) {
        throw `Unsupported --ogspv option ${ogspv}.`
              + `\nSupported options are ${ogsPvAIs.join(', ')}`;
    }
}

function setRankedUnrankedOptionsDefaults(rankedUnrankedOptions, argv) {
    for (const option of rankedUnrankedOptions) {
        if (!("default" in option)) continue;
        
        const [general, ranked, unranked] = getArgNamesGRU(option.name);

        if ((argv[general] === undefined)) {
            if ((argv[ranked] === undefined) && (argv[unranked] === undefined)) {                
                argv[general] = option.default;
            } else if (argv[unranked] === undefined) {
                argv[ranked] = option.default;
            } else if (argv[ranked] === undefined) {
                argv[unranked] = option.default;
            }
        }
    }
}

function exportMicroseconds(optionName, argv) {
    if (argv[optionName] !== undefined) {
        // Convert some times to microseconds once here so
        // we don't need to do it each time it is used later.
        exports[optionName] = argv[optionName] * 1000;
    }
}

function exportNoAutoHandicapIfMinHandicapIsPositive(rankedUnranked, argv){
    // Setting minimum handicap higher than -1 has the consequence of rejecting
    // challenge that have automatic handicap in connection.js (-1 lower than
    // minimum handicap 0 or higher, rejecting challenge)

    if (argv[`minhandicap${rankedUnranked}`] > -1) {
        exports[`noautohandicap${rankedUnranked}`] = true;
    }
}

function parseRank(arg) {
    if (arg) {
        const re = /(\d+)([kdp])/;
        const results = arg.toLowerCase().match(re);

        if (results) {
            if (results[2] === "k") {
                return (30 - parseInt(results[1]));
            } else if (results[2] === "d") {
                return (30 - 1 + parseInt(results[1]));
            } else if (results[2] === "p") {
                return (36 + parseInt(results[1]));
            }
        } else {
            throw `error: could not parse rank -${arg}-`;
        }
    }
}

function processRankExport(argName, argv) {
    const arg = argv[argName];
    if (arg) {
        exports[argName] = parseRank(arg);
    }
}

function processBansExport(argName, argv) {
    const arg = argv[argName];
    const rankedUnrankedUnderscored = getRankedUnrankedUnderscored(argName);

    if (arg) {
        const bans = arg.split(',');
        for (const bannedUser of bans) {
            exports[`banned_users${rankedUnrankedUnderscored}`][bannedUser] = true;
        }
    }
}

function processBoardsizesExport(argName, argv) {
    const arg = argv[argName];

    if (arg) {
        const rankedUnranked = getRankedUnranked(argName);
        const rankedUnrankedUnderscored = getRankedUnrankedUnderscored(rankedUnranked);
        const boardsizes = arg.split(',');
        for (const boardsize of boardsizes) {
            if (boardsize === "all") {
                exports[`allow_all_boardsizes${rankedUnrankedUnderscored}`] = true;
            } else {
                exports[`allowed_boardsizes${rankedUnrankedUnderscored}`][boardsize] = true;
            }
        }
    }
}

function processKomisExport(argName, argv) {
    const arg = argv[argName];

    if (arg) {
        const rankedUnranked = getRankedUnranked(argName);
        const rankedUnrankedUnderscored = getRankedUnrankedUnderscored(rankedUnranked);
        const komis = arg.split(',');
        for (const komi of komis) {
            if (komi === "all") {
                exports[`allow_all_komis${rankedUnrankedUnderscored}`] = true;
            } else if (komi === "automatic") {
                exports[`allowed_komis${rankedUnrankedUnderscored}`][null] = true;
            } else {
                exports[`allowed_komis${rankedUnrankedUnderscored}`][komi] = true;
            }
        }
    } 
}

function processAllowedGroupExport(argName, argv) {
    const arg = argv[argName];

    if (arg) {
        const optionName = getOptionName(argName);
        const rankedUnranked = getRankedUnranked(argName);
        const rankedUnrankedUnderscored = getRankedUnrankedUnderscored(rankedUnranked);
        const allowedValues = arg.split(',');
        for (const allowedValue of allowedValues) {
            if (allowedValue === "all") {
                exports[`allow_all_${optionName}${rankedUnrankedUnderscored}`] = true;
            } else {
                exports[`allowed_${optionName}${rankedUnrankedUnderscored}`][allowedValue] = true;
            }
        }
    } 
}

function warnIfNopauseIsMissing(rankedUnranked) {
    // avoid infinite games
    if (!exports.nopause && !exports[`nopause${rankedUnranked}`]) {
        console.log(`Warning: No --nopause nor --nopause${rankedUnranked}, ${rankedUnranked} games are likely to last forever`); 
    }
}
