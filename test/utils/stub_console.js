const sinon = require('sinon');

function stub_console(console) {
    sinon.stub(console, 'log');
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
}

exports.stub_console = stub_console;
