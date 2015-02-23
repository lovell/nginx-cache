'use strict';

var path = require('path');
var assert = require('assert');

var nginxCache = require('../');

var cacheDir = path.join(__dirname, 'fixtures');

describe('Constructor', function() {

  it('Missing directory', function() {
    var isValid = true;
    try {
      nginxCache();
    } catch (err) {
      assert.strictEqual('object', typeof err);
      assert.strictEqual(true, err instanceof Error);
      isValid = false;
    }
    assert.strictEqual(false, isValid);
  });

  it('Invalid directory', function() {
    var isValid = true;
    try {
      nginxCache(123);
    } catch (err) {
      assert.strictEqual('object', typeof err);
      assert.strictEqual(true, err instanceof Error);
      isValid = false;
    }
    assert.strictEqual(false, isValid);
  });

});

describe('Find', function() {

  it('Missing pattern', function(done) {
    var isValid = true;
    nginxCache(cacheDir)
      .find()
      .on('error', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        isValid = false;
      })
      .on('finish', function() {
        assert.strictEqual(false, isValid);
        done();
      });
  });

  it('Invalid pattern', function(done) {
    var isValid = true;
    nginxCache(cacheDir)
      .find('name')
      .on('error', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        isValid = false;
      })
      .on('finish', function() {
        assert.strictEqual(false, isValid);
        done();
      });
  });

  it('Valid - URL starts with https://', function(done) {
    var hadError = false;
    var hadWarning = false;
    var matchCount = 0;
    nginxCache(cacheDir)
      .find(new RegExp('^https://'))
      .on('match', function(file, url) {
        matchCount++;
      })
      .on('error', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadError = true;
      })
      .on('warn', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadWarning = true;
      })
      .on('finish', function() {
        assert.strictEqual(false, hadError);
        assert.strictEqual(true, hadWarning);
        assert.strictEqual(1, matchCount);
        done();
      });
  });

  it('Valid - URL contains /120/', function(done) {
    var hadError = false;
    var hadWarning = false;
    var matchCount = 0;
    nginxCache(cacheDir)
      .find(new RegExp('/120/'))
      .on('match', function(file, url) {
        matchCount++;
      })
      .on('error', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadError = true;
      })
      .on('warn', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadWarning = true;
      })
      .on('finish', function() {
        assert.strictEqual(false, hadError);
        assert.strictEqual(true, hadWarning);
        assert.strictEqual(2, matchCount);
        done();
      });
  });

  it('Valid - URL ends with image123.jpg', function(done) {
    var hadError = false;
    var hadWarning = false;
    var matchCount = 0;
    nginxCache(cacheDir)
      .find(/image123.jpg$/)
      .on('match', function(file, url) {
        matchCount++;
      })
      .on('error', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadError = true;
      })
      .on('warn', function(err) {
        assert.strictEqual('object', typeof err);
        assert.strictEqual(true, err instanceof Error);
        hadWarning = true;
      })
      .on('finish', function() {
        assert.strictEqual(false, hadError);
        assert.strictEqual(true, hadWarning);
        assert.strictEqual(2, matchCount);
        done();
      });
  });
});
