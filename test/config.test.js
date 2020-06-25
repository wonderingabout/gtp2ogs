// vim: tw=120 softtabstop=4 shiftwidth=4

const assert = require('assert');
const console = require('../console').console;
const sinon = require('sinon');

const { requireUncached } = require('../utils/requireUncached');

let argv;
let config;

function stub_console() {
    sinon.stub(console, 'log');
    sinon.stub(console, 'debug');
}

function getNewArgv() {
  return {
    debug: true,
    apikey: 'deadbeef',
    host: 'test',
    port: 80,
    username: 'testbot',
    _: ['gtp-program', '--argument'],
  };

}

describe('Argv to Config', () => {
   
    beforeEach(function() {

      argv = getNewArgv();
      config = requireUncached('../config');

      stub_console();
      
    });

    describe('Boardsizes', () => {

        it('export boardsizes', () => {
          argv.boardsizes = "9,13,19";

          config.updateFromArgv(argv); 
          const result = config.allowed_boardsizes;

          const expected = [];
          expected[9] = true;
          expected[13] = true;
          expected[19] = true;
          
          assert.deepEqual(result, expected);
          assert.deepEqual(config.allowed_boardsizes_ranked, []);
          assert.deepEqual(config.allowed_boardsizes_unranked, []);

        });

        it('export boardsizesranked', () => {
          argv.boardsizesranked = "9,13,19";

          config.updateFromArgv(argv);
          const result = config.allowed_boardsizes_ranked;

          const expected = [];
          expected[9] = true;
          expected[13] = true;
          expected[19] = true;

          assert.deepEqual(config.allowed_boardsizes, []);
          assert.deepEqual(result, expected);
          assert.deepEqual(config.allowed_boardsizes_unranked, []);

        });

        it('export boardsizesunranked', () => {
          argv.boardsizesunranked = "9,13,19";

          config.updateFromArgv(argv); 
          const result = config.allowed_boardsizes_unranked;

          const expected = [];
          expected[9] = true;
          expected[13] = true;
          expected[19] = true;

          assert.deepEqual(config.allowed_boardsizes, []);
          assert.deepEqual(config.allowed_boardsizes_ranked, []);
          assert.deepEqual(result, expected);

        });
    
    });

    describe('Min Rank', () => {

      it('export minrank', () => {
        argv.minrank = "13k";

        config.updateFromArgv(argv); 
        const result = config.allowed_boardsizes;

        const expected = [];
        expected[9] = true;
        expected[13] = true;
        expected[19] = true;
        
        assert.deepEqual(result, expected);
        assert.deepEqual(config.allowed_boardsizes_ranked, []);
        assert.deepEqual(config.allowed_boardsizes_unranked, []);

      });

      it('export minrank (pro)', () => {
        argv.minrank = "1p";

        config.updateFromArgv(argv); 
        const result = config.minrank;

        const expected = 37;
        
        assert.deepEqual(result, expected);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(config.minrankunranked, undefined);

      });

      it('export minrankranked', () => {
        argv.minrankranked = "1d";

        config.updateFromArgv(argv);
        const result = config.minrankranked;

        const expected = 30;

        assert.deepEqual(config.minrank, undefined);
        assert.deepEqual(result, expected);
        assert.deepEqual(config.minrankunranked, undefined);

      });

      it('export minrankunranked', () => {
        argv.minrankunranked = "5k";

        config.updateFromArgv(argv); 
        const result = config.minrankunranked;

        const expected = 25;

        assert.deepEqual(config.minrank, undefined);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(result, expected);

      });
  
  });

});
