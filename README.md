# nginx-cache

A Node.js module that recursively scans
the directories and files of an _Nginx_ cache
as efficiently as possible
looking for partial URL key matches
based on a regular expression.

## Install

```sh
npm install nginx-cache
```

```sh
yarn add nginx-cache
```

## Usage example

Purge all CSS files from an Nginx cache:

```javascript
const NginxCache = require('nginx-cache');

NginxCache('/var/www/cache')
  .find(/.css$/)
  .on('match', function(file, url) {
    console.log('Attempting to remove cached version of ' + url);
    fs.unlink(file, function(err) {
      if (err) {
        console.log(err.message);
      }
    });
  })
  .on('error', function(err) {
    console.log(err.message);
  })
  .on('finish', function() {
    console.log('Done');
  });
```

## API

### NginxCache(directory)

Constructor to which further methods are chained.

* `directory` is the path to the _Nginx_ cache, as provided to its `proxy_cache_path` directive.

### find(pattern)

* `pattern` is an instance of a standard JavaScript `RegExp` object.

### on(event, listener)

Register a function to listen for the given event, where:

* `event` is a String containing the name of the event (see below), and
* `listener` is a function to call when the event is emitted.

#### Event: 'match'

The `match` event is emitted when a cache file matching the `pattern` passed to `find()` is found.

The event attributes are `file, url` where:

* `file` is the full path to the matching cache file, and
* `url` is the full cache key that matched the pattern.

#### Event: 'finish'

The `finish` event is emitted when all cache directories and files have been scanned.
No further events are emitted after this.

#### Event: 'error'

The `error` event is emitted when a non-ignorable problem occurs,
e.g. lack of permission to read files in the cache directory.

#### Event: 'warn'

The `warn` event is emitted when an ignorable problem occurs,
e.g. the Nginx cache manager deleted a file.

## Alternatives

If you know the complete, original cache key
then the commercial _Plus_ version of _Nginx_ provides a
[proxy_cache_purge](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_purge) directive,
which may be more suitable.

## Licence

Copyright 2015, 2017 Dispatches LLP.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
