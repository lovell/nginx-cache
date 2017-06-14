'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const events = require('events');

const async = require('async');

/*
  Constructor - requires path to cache directory
*/
const NginxCache = function (directory) {
  if (!(this instanceof NginxCache)) {
    return new NginxCache(directory);
  }
  events.EventEmitter.call(this);
  // Store cache directory
  if (typeof directory === 'string') {
    this.directory = directory;
  } else {
    throw new Error('Directory required');
  }
  return this;
};
util.inherits(NginxCache, events.EventEmitter);

/*
  Find cache files where the key, usually the URL, matches the RegExp pattern
*/
NginxCache.prototype.find = function (pattern) {
  const that = this;
  process.nextTick(function () {
    if (typeof pattern === 'object' && pattern instanceof RegExp) {
      // Reset depth counter
      that.depth = 0;
      // Start recursion into directory tree
      that._findDirectory(that.directory, pattern);
    } else {
      that.emit('error', new Error('Invalid RegExp'));
      that.emit('finish');
    }
  });
  return this;
};

/*
  Look in a directory for cache files
*/
NginxCache.prototype._findDirectory = function (directory, pattern) {
  const that = this;
  // Increment depth counter
  that.depth++;
  // Get children
  fs.readdir(directory, function (err, files) {
    if (err) {
      if (err.code === 'EACCES' && directory === that.directory) {
        that.emit('error', new Error('Permission denied to read files in root of cache directory ' + directory));
      } else {
        that.emit('warn', err);
      }
    } else {
      // Loop over children, limiting the number of files open at once
      async.eachSeries(files, function (file, done) {
        const child = path.join(directory, file);
        fs.stat(child, function (err, stat) {
          if (err) {
            that.emit('warn', err);
          } else {
            if (stat.isFile()) {
              that._findFile(child, pattern);
            } else if (stat.isDirectory()) {
              that._findDirectory(child, pattern);
            }
          }
          done();
        });
      }, function () {
        // Decrement depth counter
        that.depth--;
        if (that.depth === 0) {
          that.emit('finish');
        }
      });
    }
  });
};

/*
  Look in a cache file for pattern
*/
NginxCache.prototype._findFile = function (file, pattern) {
  const that = this;
  // Increment depth counter
  that.depth++;
  // Open read-only file descriptor
  fs.open(file, 'r', function (err, fd) {
    if (err) {
      // The Nginx Cache Manager probably deleted the file
      that.emit('warn', err);
    } else {
      // Read first 1024 bytes from file, enough for headers
      const buffer = Buffer.alloc(1024);
      fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead, data) {
        if (err) {
          that.emit('warn', err);
        } else {
          // Extract the cache key from the Buffer
          const key = keyFromBuffer(data, bytesRead);
          if (key) {
            if (pattern.test(key)) {
              // Found a match
              that.emit('match', file, key);
            }
          } else {
            that.emit('warn', new Error('Could not find headers at start of ' + file));
          }
        }
        // Close file descriptor
        fs.close(fd, function () { });
        // Decrement depth counter
        that.depth--;
        if (that.depth === 0) {
          that.emit('finish');
        }
      });
    }
  });
};

/*
  Seek '\nKEY: {{key}}\n' in a Buffer and extract '{{key}}'
*/
const keyFromBuffer = function (buffer, length) {
  let key = null;
  // Seek position in Buffer
  let pos = 0;
  // Seek '\nKEY: ' for start
  let keyStart = -1;
  while (pos < (length - 7) && keyStart === -1) {
    if (
      buffer[pos] === 0x0a &&      // '\n'
      buffer[pos + 1] === 0x4b &&  // 'K'
      buffer[pos + 2] === 0x45 &&  // 'E'
      buffer[pos + 3] === 0x59 &&  // 'Y'
      buffer[pos + 4] === 0x3a &&  // ':'
      buffer[pos + 5] === 0x20     // ' '
    ) {
      keyStart = pos + 6;
    }
    pos++;
  }
  if (keyStart !== -1) {
    // Seek '\n' for end
    let keyEnd = -1;
    while (pos < length && keyEnd === -1) {
      if (buffer[pos] === 0x0a) {
        keyEnd = pos;
      }
      pos++;
    }
    if (keyEnd !== -1) {
      key = buffer.toString('utf8', keyStart, keyEnd);
    }
  }
  return key;
};

module.exports = NginxCache;
