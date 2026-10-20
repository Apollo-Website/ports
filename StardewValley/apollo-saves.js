window.__APOLLO_STARDEW_SAVES__ = async function() {
  const fs = window.__APOLLO_DOTNET_MODULE__?.FS;
  if (!fs) throw new Error('The game filesystem did not initialize.');
  fs.mkdirTree('/idbfs');
  fs.isDir ||= mode => (mode & 61440) === 16384;
  const database = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('/idbfs', 21);
    request.onupgradeneeded = () => { const store = request.result.createObjectStore('FILE_DATA'); store.createIndex('timestamp', 'timestamp'); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  fs.syncfs = (populate, callback) => {
    (async () => {
      const db = await database(), transaction = db.transaction('FILE_DATA', populate ? 'readonly' : 'readwrite'), store = transaction.objectStore('FILE_DATA');
      const finished = new Promise((resolve, reject) => { transaction.oncomplete = resolve; transaction.onabort = transaction.onerror = () => reject(transaction.error); });
      if (populate) {
        const keys = store.getAllKeys(), values = store.getAll();
        await finished;
        for (let i = 0; i < keys.result.length; i++) {
          const name = keys.result[i], file = values.result[i];
          if (!name.startsWith('/idbfs/') || name.split('/').includes('..')) throw new Error('Invalid stored save path.');
          if (fs.isDir(file.mode)) fs.mkdirTree(name);
          else {
            fs.mkdirTree(name.slice(0, name.lastIndexOf('/')));
            fs.writeFile(name, file.contents);
          }
        }
      } else {
        const visit = directory => {
          for (const name of fs.readdir(directory)) {
            if (name === '.' || name === '..') continue;
            const file = directory + '/' + name, stat = fs.stat(file);
            if (fs.isDir(stat.mode)) visit(file);
            else store.put({ timestamp: new Date(), mode: 33206, contents: fs.readFile(file) }, file);
          }
        };
        store.clear(); visit('/idbfs'); await finished;
      }
      db.close();
    })().then(() => callback?.(null), error => callback?.(error));
  };
  await new Promise((resolve, reject) => fs.syncfs(true, error => error ? reject(error) : resolve()));
  parent.__APOLLO_INSTALL_FS__(fs);
  let busy = false;
  setInterval(() => { if (!busy) { busy = true; fs.syncfs(false, () => { busy = false; }); } }, 5000);
};
