// vim: tw=120 softtabstop=4 shiftwidth=4

const assert = require('assert');

const { getNewArgvReset } = require('./module_loading/getNewArgvReset');
const { getNewConfigUncached } = require('./module_loading/getNewConfigUncached');
const { stub_console } = require('./utils/stub_console');

let argv;
let config;

describe('Argv to Config', () => {
   
    beforeEach(function() {

      argv = getNewArgvReset();
      config = getNewConfigUncached();

      stub_console();
      
    });

    describe('Boardsizes', () => {

        it('export boardsizes', () => {
          argv.boardsizes = "9,13,19";

          config.updateFromArgv(argv); 

          const arrayExpected = [];
          arrayExpected[9] = true;
          arrayExpected[13] = true;
          arrayExpected[19] = true;
          
          assert.deepEqual(config.allowed_boardsizes, arrayExpected);
          assert.deepEqual(config.allowed_boardsizes_ranked, []);
          assert.deepEqual(config.allowed_boardsizes_unranked, []);

        });

        it('export boardsizesranked', () => {
          argv.boardsizesranked = "9,13,19";

          config.updateFromArgv(argv);

          const arrayExpected = [];
          arrayExpected[9] = true;
          arrayExpected[13] = true;
          arrayExpected[19] = true;

          assert.deepEqual(config.allowed_boardsizes, []);
          assert.deepEqual(config.allowed_boardsizes_ranked, arrayExpected);
          assert.deepEqual(config.allowed_boardsizes_unranked, []);

        });

        it('export boardsizesunranked', () => {
          argv.boardsizesunranked = "9,13,19";

          config.updateFromArgv(argv); 

          const arrayExpected = [];
          arrayExpected[9] = true;
          arrayExpected[13] = true;
          arrayExpected[19] = true;

          assert.deepEqual(config.allowed_boardsizes, []);
          assert.deepEqual(config.allowed_boardsizes_ranked, []);
          assert.deepEqual(config.allowed_boardsizes_unranked, arrayExpected);

        });

        it('set default if boardsizes is not used', () => {
          config.updateFromArgv(argv);

          assert.deepEqual(config.boardsizes, "9,13,19");
          assert.deepEqual(config.boardsizesranked, undefined);
          assert.deepEqual(config.boardsizesunranked, undefined);

        });
    
    });

    describe('Min Rank', () => {

      it('export minrank', () => {
        argv.minrank = "13k";

        config.updateFromArgv(argv); 

        assert.deepEqual(config.minrank, 17);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(config.minrankunranked, undefined);

      });

      it('export minrank (pro)', () => {
        argv.minrank = "1p";

        config.updateFromArgv(argv); 
        
        assert.deepEqual(config.minrank, 37);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(config.minrankunranked, undefined);

      });

      it('export minrankranked', () => {
        argv.minrankranked = "1d";

        config.updateFromArgv(argv);

        assert.deepEqual(config.minrank, undefined);
        assert.deepEqual(config.minrankranked, 30);
        assert.deepEqual(config.minrankunranked, undefined);

      });

      it('export minrankunranked', () => {
        argv.minrankunranked = "5k";

        config.updateFromArgv(argv); 

        assert.deepEqual(config.minrank, undefined);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(config.minrankunranked, 25);

      });

      it('do not export if minrank is not used', () => {
        config.updateFromArgv(argv);

        assert.deepEqual(config.minrank, undefined);
        assert.deepEqual(config.minrankranked, undefined);
        assert.deepEqual(config.minrankunranked, undefined);

      });
  
  });

  describe('Persist', () => {

    it('export persist', () => {
      argv.persist = true;

      config.updateFromArgv(argv); 
      const result = config.persist;

      const expected = true;
      
      assert.deepEqual(result, expected);

    });

    it('do not export if persist is not used', () => {
      config.updateFromArgv(argv); 
      const result = config.persist;

      const expected = undefined;
      
      assert.deepEqual(result, expected);

    });

  });

});
