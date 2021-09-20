const express = require('express');
const fs = require('fs');
const path = require('path');
const swPrecache = require('sw-precache');

const fileName = 'file.txt';
const staticPath = path.join(__dirname, 'public');
const filePath = path.join(staticPath, fileName);
const port = 8265;

const createOneMBTextFile = async () => {
  const size = 1000000;
  const exists = await fs.promises.access(filePath).catch(() => false);
  if (exists) {
    const stats = await fs.promises.stat(filePath);
    if (stats.size === size) {
      return;
    }
  }

  const string = Array.from({ length: size }).map(() => '1').join('');
  return fs.promises.writeFile(filePath, string);
};

const createSWFile = async () => {
  const config = {
    cacheId: 'cache',
    claimsClient: true,
    skipWaiting: true,
    directoryIndex: false,
    handleFetch: true,
    staticFileGlobs: [ filePath ],
    stripPrefixMulti: { [staticPath]: '' },
    maximumFileSizeToCacheInBytes: 1048576 * 30,
  };

  return swPrecache.write(path.join(staticPath, 'service-worker.js'), config);
};

const startServer = () => {
  const app = express();
  app.use(express.static(staticPath));
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });
  app.get('/stop', (req, res) => {
    res.status(200);
    res.end();
    process.exit();
  });

  app.listen(port);
  console.log('Server listening on port', port);
};

(async () => {
  await createOneMBTextFile();
  await createSWFile();

  startServer();
})();


