// vim: tw=120 softtabstop=4 shiftwidth=4

let assert = require('assert');

let config;
let connection = require('../connection');
let console = require('../console').console;

let sinon = require('sinon');

let https = require('https');

let { FakeSocket, FakeAPI, base_challenge } = require('./test')

function stub_console() {
    sinon.stub(console, 'log');
    sinon.stub(console, 'debug');
}

function getNewConfig() {
  const config = require('../config');

  config.DEBUG = true;
  config.apikey = 'deadbeef';
  config.host = 'test';
  config.port = 80;
  config.username = 'testbot';
 
  config.allowed_boardsizes[19] = true;
  config.allow_all_komis = true;
  config.allowed_speeds['live'] = true;
  config.allowed_timecontrols['fischer'] = true;

  config.bot_command = ['gtp-program', '--argument'];
  return config; 
}

afterEach(function () {
    sinon.restore();
});

describe('Challenges', () => {
  
  let conn;
 
  beforeEach(function() {
    config = getNewConfig();
    stub_console();
    sinon.useFakeTimers();
    
    let fake_api = new FakeAPI();
    fake_api.request({path: '/foo'}, () => {});
    sinon.stub(https, 'request').callsFake(fake_api.request);
    
    let fake_socket = new FakeSocket();
    conn = new connection.Connection(() => { return fake_socket; });
  });
  
  describe('Bans', () => {
    it('should reject banned users', () => {
      let notification = base_challenge({ user: { username: 'bannedName', id: 5 } });

      config.banned_users[notification.user.username] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedName) are not allowed to play games against this bot.' }));
    })
    
    it('should reject banned users by id', () => {
      let notification = base_challenge({ user: { username: 'bannedName', id: 5 } });

      config.banned_users[notification.user.id] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedName) are not allowed to play games against this bot.' }));
    })
      
    it('should reject banned ranked users', () => {
      let notification = base_challenge({ ranked: true, user: { username: 'bannedRankedName', id: 6 } });

      config.banned_users_ranked[notification.user.username] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedRankedName) are not allowed to play ranked games against this bot.' }));
    })
      
    it('should reject banned ranked users by id', () => {
      let notification = base_challenge({ ranked: true, user: { username: 'bannedRankedName', id: 6 } });

      config.banned_users_ranked[notification.user.id] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedRankedName) are not allowed to play ranked games against this bot.' }));
    })
    
    it('should reject banned unranked users', () => {
      let notification = base_challenge({ ranked: false, user: { username: 'bannedUnrankedName', id: 7 } });

      config.banned_users_unranked[notification.user.username] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedUnrankedName) are not allowed to play unranked games against this bot.' }));
    })
    
    it('should reject banned unranked users by id', () => {
      let notification = base_challenge({ ranked: false, user: { username: 'bannedUnrankedName', id: 7 } });

      config.banned_users_unranked[notification.user.id] = true;
      
      let result = conn.checkChallengeMandatory(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'You (bannedUnrankedName) are not allowed to play unranked games against this bot.' }));
    })

  })

  describe('Byoyomi time settings', () => {

    // Main Time Blitz

    it('reject main time blitz too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 1 } });

      config.minmaintimeblitz = 10;
      config.maxmaintimeblitz = 30;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Minimum Main Time for blitz games in byoyomi is 10 seconds, please increase Main Time.' }));
    })

    it('accept main time blitz edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 10, periods: 1, period_time: 1 } });

      config.minmaintimeblitz = 10;
      config.maxmaintimeblitz = 30;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept main time blitz between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 20, periods: 1, period_time: 1 } });

      config.minmaintimeblitz = 10;
      config.maxmaintimeblitz = 30;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept main time blitz edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 30, periods: 1, period_time: 1 } });

      config.minmaintimeblitz = 10;
      config.maxmaintimeblitz = 30;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept main time blitz too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 31, periods: 1, period_time: 1 } });

      config.minmaintimeblitz = 10;
      config.maxmaintimeblitz = 30;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Main Time for blitz games in byoyomi is 30 seconds, please reduce Main Time.' }));
    })

    // Periods Blitz

    it('reject number of periods blitz too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 1 } });

      // remove old vars
      // this is not clean but it is a workaround until we review this
      config.minmaintimeblitz = 0;
      config.maxmaintimeblitz = 9999999999;

      config.minperiodsblitz = 3;
      config.maxperiodsblitz = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Minimum number of periods for blitz games in byoyomi is 3, please increase the number of periods.' }));
    })

    it('accept number of periods blitz edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 3, period_time: 1 } });

      config.minperiodsblitz = 3;
      config.maxperiodsblitz = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept number of periods blitz between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 12, period_time: 1 } });

      config.minperiodsblitz = 3;
      config.maxperiodsblitz = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept number of periods blitz edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 20, period_time: 1 } });

      config.minperiodsblitz = 3;
      config.maxperiodsblitz = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept number of periods blitz too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 100, period_time: 1 } });

      config.minperiodsblitz = 3;
      config.maxperiodsblitz = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum number of periods for blitz games in byoyomi is 20, please reduce the number of periods.' }));
    })

    // Period Time Blitz

    it('reject period time blitz too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 1 } });

      // remove old vars
      // this is not clean but it is a workaround until we review this
      config.minperiodsblitz = 0;
      config.maxperiodsblitz = 9999999999;

      config.minperiodtimeblitz = 5;
      config.maxperiodtimeblitz = 15;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: `Minimum Period Time for blitz games in byoyomi is 5 seconds, please increase Period Time.` }));
    })

    it('accept period time blitz edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 5 } });

      config.minperiodtimeblitz = 5;
      config.maxperiodtimeblitz = 15;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept period time blitz between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 11 } });

      config.minperiodtimeblitz = 5;
      config.maxperiodtimeblitz = 15;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept period time blitz edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 15 } });

      config.minperiodtimeblitz = 5;
      config.maxperiodtimeblitz = 15;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })

    it('accept period time blitz too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "blitz", main_time: 1, periods: 1, period_time: 22 } });

      config.minperiodtimeblitz = 5;
      config.maxperiodtimeblitz = 15;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Period Time for blitz games in byoyomi is 15 seconds, please reduce Period Time.' }));
    })

    // Main Time Live

    it('reject main time live too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 1 } });
  
      config.minmaintimelive = 60;
      config.maxmaintimelive = 300;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Minimum Main Time for live games in byoyomi is 1 minutes, please increase Main Time.' }));
    })
  
    it('accept main time live edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 60, periods: 1, period_time: 1 } });
  
      config.minmaintimelive = 60;
      config.maxmaintimelive = 300;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept main time live between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 180, periods: 1, period_time: 1 } });
  
      config.minmaintimelive = 60;
      config.maxmaintimelive = 300;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept main time live edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 300, periods: 1, period_time: 1 } });
  
      config.minmaintimelive = 60;
      config.maxmaintimelive = 300;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept main time live too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 301, periods: 1, period_time: 1 } });
  
      config.minmaintimelive = 60;
      config.maxmaintimelive = 300;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Main Time for live games in byoyomi is 5 minutes, please reduce Main Time.' }));
    })
  
    // Periods Live
  
    it('reject number of periods live too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 1 } });
  
      // remove old vars
      // this is not clean but it is a workaround until we review this
      config.minmaintimelive = 0;
      config.maxmaintimelive = 9999999999;
  
      config.minperiodslive = 3;
      config.maxperiodslive = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Minimum number of periods for live games in byoyomi is 3, please increase the number of periods.' }));
    })
  
    it('accept number of periods live edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 3, period_time: 1 } });
  
      config.minperiodslive = 3;
      config.maxperiodslive = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept number of periods live between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 12, period_time: 1 } });
  
      config.minperiodslive = 3;
      config.maxperiodslive = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept number of periods live edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 20, period_time: 1 } });
  
      config.minperiodslive = 3;
      config.maxperiodslive = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept number of periods live too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 100, period_time: 1 } });
  
      config.minperiodslive = 3;
      config.maxperiodslive = 20;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum number of periods for live games in byoyomi is 20, please reduce the number of periods.' }));
    })
  
    // Period Time Live
  
    it('reject period time live too low', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 1 } });
  
      // remove old vars
      // this is not clean but it is a workaround until we review this
      config.minperiodslive = 0;
      config.maxperiodslive = 9999999999;
  
      config.minperiodtimelive = 10;
      config.maxperiodtimelive = 120;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: `Minimum Period Time for live games in byoyomi is 10 seconds, please increase Period Time.` }));
    })
  
    it('accept period time live edge min', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 10 } });
  
      config.minperiodtimelive = 10;
      config.maxperiodtimelive = 120;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept period time live between min and max ', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 30 } });
  
      config.minperiodtimelive = 10;
      config.maxperiodtimelive = 120;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept period time live edge max', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 120 } });
  
      config.minperiodtimelive = 10;
      config.maxperiodtimelive = 120;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: false }));
    })
  
    it('accept period time live too high', () => {
      let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "live", main_time: 1, periods: 1, period_time: 121 } });
  
      config.minperiodtimelive = 10;
      config.maxperiodtimelive = 120;
      
      let result = conn.checkChallengeMinMax(notification);
      
      assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Period Time for live games in byoyomi is 2 minutes, please reduce Period Time.' }));
    })

  })

  // Main Time Correspondence

  it('reject main time correspondence too low', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 1 } });

    config.minmaintimecorr = 259200;
    config.maxmaintimecorr = 604800;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: 'Minimum Main Time for correspondence games in byoyomi is 3 days, please increase Main Time.' }));
  })

  it('accept main time correspondence edge min', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 259200, periods: 1, period_time: 1 } });

    config.minmaintimecorr = 259200;
    config.maxmaintimecorr = 604800;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept main time correspondence between min and max ', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 454600, periods: 1, period_time: 1 } });

    config.minmaintimecorr = 259200;
    config.maxmaintimecorr = 604800;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept main time correspondence edge max', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 604800, periods: 1, period_time: 1 } });

    config.minmaintimecorr = 259200;
    config.maxmaintimecorr = 604800;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept main time correspondence too high', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 604801, periods: 1, period_time: 1 } });

    config.minmaintimecorr = 259200;
    config.maxmaintimecorr = 604800;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Main Time for correspondence games in byoyomi is 7 days, please reduce Main Time.' }));
  })

  // Periods Correspondence

  it('reject number of periods correspondence too low', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 1 } });

    // remove old vars
    // this is not clean but it is a workaround until we review this
    config.minmaintimecorr = 0;
    config.maxmaintimecorr = 9999999999;

    config.minperiodscorr = 3;
    config.maxperiodscorr = 10;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: 'Minimum number of periods for correspondence games in byoyomi is 3, please increase the number of periods.' }));
  })

  it('accept number of periods correspondence edge min', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 3, period_time: 1 } });

    config.minperiodscorr = 3;
    config.maxperiodscorr = 10;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept number of periods correspondence between min and max ', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 5, period_time: 1 } });

    config.minperiodscorr = 3;
    config.maxperiodscorr = 10;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept number of periods correspondence edge max', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 10, period_time: 1 } });

    config.minperiodscorr = 3;
    config.maxperiodscorr = 10;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept number of periods correspondence too high', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 25, period_time: 1 } });

    config.minperiodscorr = 3;
    config.maxperiodscorr = 10;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: 'Maximum number of periods for correspondence games in byoyomi is 10, please reduce the number of periods.' }));
  })

  // Period Time Correspondence

  it('reject period time correspondence too low', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 1 } });

    // remove old vars
    // this is not clean but it is a workaround until we review this
    config.minperiodscorr = 0;
    config.maxperiodscorr = 9999999999;

    config.minperiodtimecorr = 14400;
    config.maxperiodtimecorr = 259200;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: `Minimum Period Time for correspondence games in byoyomi is 4 hours, please increase Period Time.` }));
  })

  it('accept period time correspondence edge min', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 14400 } });

    config.minperiodtimecorr = 14400;
    config.maxperiodtimecorr = 259200;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept period time correspondence between min and max ', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 60000 } });

    config.minperiodtimecorr = 14400;
    config.maxperiodtimecorr = 259200;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept period time correspondence edge max', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 259200 } });

    config.minperiodtimecorr = 14400;
    config.maxperiodtimecorr = 259200;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: false }));
  })

  it('accept period time correspondence too high', () => {
    let notification = base_challenge({ ranked: false, time_control: { system: "byoyomi", time_control: "byoyomi", speed: "correspondence", main_time: 1, periods: 1, period_time: 512000 } });

    config.minperiodtimecorr = 14400;
    config.maxperiodtimecorr = 259200;
    
    let result = conn.checkChallengeMinMax(notification);
    
    assert.deepEqual(result, ({ reject: true,   msg: 'Maximum Period Time for correspondence games in byoyomi is 3 days, please reduce Period Time.' }));
  })

})
