const sinon = require('sinon');

function stub_real_console() {
    sinon.stub(console, 'log');
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
}

exports.stub_real_console = stub_real_console;
