describe('Throttle for service worker requests', () => {

  const fileUrl = '/file.txt';
  const throttle = async () => {
    await browser.throttle({
      offline: false,
      downloadThroughput: 2 * 100 * 1000, // expect a ~5 second download time
      uploadThroughput: 2 * 100 * 1000,
      latency: 20,
    });
  };

  const fetchFileDuration = () => browser.executeAsync((fileUrl, done) => {
    const now = new Date().getTime();
    fetch(fileUrl)
      .then(response => response.blob())
      .then(() => done([null, new Date().getTime() - now]))
      .catch((err) => done([err.message]));
  }, fileUrl);

  const installServiceWorker = () => browser.executeAsync(done => {
    const now = new Date().getTime();
    //document.write('installing service worker');
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          done([null, 0]);
        }

        installingWorker.onstatechange = () => {
          if (['activated', 'redundant'].includes(installingWorker.state)) {
            done([null, new Date().getTime() - now]);
          }
        };
      })
      .catch((err) => done([err.message]));
  });

  const getCacheDetails = () => browser.executeAsync(async (done) => {
    try {
      const cacheNames = await caches.keys();
      if (!cacheNames[0]) {
        done([null, []]);
      }

      const cache = await caches.open(cacheNames[0]);
      const cachedRequests = await cache.keys();
      const cachedRequestUrls = cachedRequests.map(req => req.url.replace(/\?_sw-precache=[a-z0-9]+$/, ''));
      done([null, cachedRequestUrls]);
    } catch (err) {
      done([err.message]);
    }
  });

  afterEach(async () => {
    await browser.reloadSession();
  });

  beforeEach(async () => {
    await browser.url('/');
  })

  it('service worker request order of magnitude compared to fetch',  async () => {
    await throttle();

    const [ , installWorkerDuration ] = await installServiceWorker();

    // expect the cache to be created
    const [ , cacheDetails ] = await getCacheDetails();
    expect(cacheDetails).toEqual([`${browser.config.baseUrl}/file.txt`]);

    const [ , fetchFileWithSw] = await fetchFileDuration();

    // reloading to make sure service worker is unregistered
    await browser.reloadSession();
    await browser.url('/');
    await throttle();

    const [ , downloadingFileDuration] = await fetchFileDuration();

    console.log('Service worker activated in', installWorkerDuration / 1000 , 's');
    console.log('With SW File was downloaded in', fetchFileWithSw / 1000 , 's');
    console.log('Without SW File was downloaded in', downloadingFileDuration / 1000 , 's');

    expect(installWorkerDuration).toBeGreaterThan(0);
    expect(downloadingFileDuration).toBeGreaterThan(0);

    const ratio = Math.round((downloadingFileDuration - installWorkerDuration) / installWorkerDuration * 100);
    expect(ratio).toBeLessThan(100); // when ratio is 100, installWorkerDuration = 2 x downloadingFileDuration
  });

  it('should not install service worker when browser is offline', async () => {
    await browser.throttle('offline');

    const [, installSwDuration] = await installServiceWorker();
    expect(installSwDuration).toEqual(undefined);
  });

  it('should not fetch file while offline', async () => {
    await browser.throttle('offline');

    const [err, fetchDuration] = await fetchFileDuration();
    expect(fetchDuration).toEqual(undefined);
    expect(err).not.toEqual(undefined);
  });
});
