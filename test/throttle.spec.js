describe('Throttle for service worker requests',  ()  => {

  const fileUrl = '/file.txt';

  const setupSession = async () => {
    await browser.url('/');
    await browser.setTimeout({ script: 10000 });
    await browser.throttle({
      offline: false,
      downloadThroughput: 2 * 100 * 1000, // expect a ~5 second download time
      uploadThroughput: 2 * 100 * 1000,
      latency: 20,
    });
  };

  const fetchFileDuration = () => browser.executeAsync( (fileUrl, done) => {
    const now = new Date().getTime();
    fetch(fileUrl)
      .then(response => response.blob())
      .then(() => done(new Date().getTime() - now))
      .catch(() => done(0));
  }, fileUrl);

  it('service worker request order of magnitude compared to fetch',  async () => {
    await setupSession();

    const installWorkerDuration = await browser.executeAsync(done => {
      const now = new Date().getTime();
      //document.write('installing service worker');
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            done(0);
          }

          installingWorker.onstatechange = () => {
            if (['activated', 'redundant'].includes(installingWorker.state)) {
              done(new Date().getTime() - now);
            }
          };
        })
        .catch(() => done(0));
    });

    // expect the cache to be created
    const cacheDetails = await browser.executeAsync(async (done) => {
      const cacheNames = await caches.keys();
      const cache = await caches.open(cacheNames[0]);
      const cachedRequests = await cache.keys();
      const cachedRequestUrls = cachedRequests.map(req => req.url.replace(/\?_sw-precache=[a-z0-9]+$/, ''));
      done(cachedRequestUrls);
    });

    expect(cacheDetails.length).toEqual(1);
    expect(cacheDetails[0]).toEqual(`${browser.config.baseUrl}/file.txt`);

    const fetchFileWithSw = await fetchFileDuration();

    // reloading to make sure service worker is unregistered
    await browser.reloadSession();
    await setupSession();

    const downloadingFileDuration = await fetchFileDuration();

    console.log('Service worker activated in', installWorkerDuration / 1000 , 's');
    console.log('With SW File was downloaded in', fetchFileWithSw / 1000 , 's');
    console.log('Without SW File was downloaded in', downloadingFileDuration / 1000 , 's');

    expect(Math.round(downloadingFileDuration / 1000)).toBeGreaterThanOrEqual(4); // optimistic
    expect(Math.round(installWorkerDuration / 1000)).toBeGreaterThanOrEqual(4); // optimistic
  });
});
