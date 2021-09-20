This is a test suite displaying how `browser.throttle` doesn't affect fetch requests that are initiated by a service-worker. 

Install with `npm ci`.
Run test with:
```shell
npm test
```
The test will start a very simple express server that listens to port `8265`. To use a different port run: 
```shell
PORT=<desired_port> && npm test
```
The server process is killed when the test is complete.

The server creates a 1MB text file and generates a service-worker script that precaches this file, using sw-precache.
The test will: 
- call `browser.throttle`, so that it would take roughly 5 seconds to download the 1MB file (downloadThroughput = 2 * 100 * 1000, file size = 10 * 100 * 1000)
- install this service worker script and wait for activation, then test that the 1MB text file is cached.
- fetch the file
- reset the session and call `browser.trottle` again, with the same options (downloadThroughput = 2 * 100 * 1000)
- fetch the file
- calculate the ratio between how long it took to install the service worker compared to downloading the file directly. Expects this ratio to be lower than 100 (when installing the service is twice as fast as downloading the file).



