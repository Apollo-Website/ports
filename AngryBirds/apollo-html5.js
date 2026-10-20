(async () => {
  const canvas = document.getElementById('canvas'), loading = document.getElementById('loading');
  try {
    const manifest = await (await fetch('package-manifest.json')).json();
    const resource = async (path, parts, type) => {
      if (!parts) return new URL(path, location.href).href;
      const chunks = await Promise.all(Array.from({ length: parts }, async (_, index) => {
        const response = await fetch(path + '.part' + (index + 1));
        if (!response.ok) throw new Error('A game file could not be downloaded.');
        return response.blob();
      }));
      return URL.createObjectURL(new Blob(chunks, { type }));
    };
    const script = path => new Promise((resolve, reject) => {
      const element = document.createElement('script');
      element.src = path;
      element.onload = resolve;
      element.onerror = () => reject(new Error('The game engine could not be loaded.'));
      document.head.appendChild(element);
    });
    window.open = () => null;
    if (manifest.engine === 'legacy-unity') {
      if (manifest.id === 'ducklife6') {
      let pokiObject;
      window.initPokiBridge = object => { pokiObject = object; setTimeout(() => window.gameInstance.SendMessage(object, 'Ready'), 0); };
      window.pokiRequestAd = () => window.gameInstance.SendMessage(pokiObject, 'AdEvent', 'skipped');
      window.pokiTrack = () => {};
      window.poki = { ads: { position: { midroll: 'midroll' } }, tracking: { screen: { gameLoaderStart: 'gameLoaderStart', gameLoaderFinished: 'gameLoaderFinished', gameStart: 'gameStart' } } };
      }
      const config = await (await fetch('Build/game.json')).json();
      config.cacheControl = { default: 'no-store' };
      for (const key of ['dataUrl', 'asmCodeUrl', 'asmMemoryUrl', 'asmFrameworkUrl', 'wasmCodeUrl', 'wasmFrameworkUrl', 'wasmMemoryUrl']) {
        if (!config[key]) continue;
        const path = 'Build/' + config[key], asset = manifest.resources.find(file => file.path === path);
        config[key] = await resource(path, asset?.parts, key === 'wasmCodeUrl' ? 'application/wasm' : key.includes('Code') || key.includes('Framework') ? 'application/javascript' : 'application/octet-stream');
      }
      if (manifest.id === 'angry-birds-2') await script('streaming-fix.js');
      await script('UnityLoader.js');
      const configuration = URL.createObjectURL(new Blob([JSON.stringify(config)], { type: 'application/json' }));
      window.gameInstance = UnityLoader.instantiate('gameContainer', configuration, { onProgress(instance, progress) {
        loading.textContent = 'Loading… ' + Math.round(progress * 100) + '%';
        if (progress === 1) { loading.remove(); window.__APOLLO_ENGINE_READY__ = true; }
      } });
      if (manifest.id === 'angry-birds-2') setInterval(() => {
        const module = window.gameInstance?.Module, exports = module?.asm;
        if (!module?.calledRun || !exports?.dynCall_iiii) return;
        const bytes = new TextEncoder().encode('ToonsButton\0'), pointer = exports._malloc(bytes.length);
        module.HEAPU8.set(bytes, pointer);
        const name = exports.dynCall_iiii(3537, 0, pointer, 0);
        exports._free(pointer);
        const button = exports.dynCall_iii(5946, name, 0);
        if (button) exports.dynCall_viii(4090, button, 0, 0);
      }, 500);
    } else {
      await script('Build/' + manifest.build + '.loader.js');
      window.unityInstance = await createUnityInstance(canvas, {
        dataUrl: await resource('Build/' + manifest.build + '.data', manifest.dataParts, 'application/octet-stream'),
        codeUrl: await resource('Build/' + manifest.build + '.wasm', manifest.wasmParts, 'application/wasm'),
        frameworkUrl: 'Build/' + manifest.build + '.framework.js',
        streamingAssetsUrl: 'StreamingAssets', companyName: 'Apollo', productName: manifest.id,
        productVersion: '1.0', autoSyncPersistentDataPath: false
      }, progress => { loading.textContent = 'Loading… ' + Math.round(progress * 100) + '%'; });
      loading.remove();
      canvas.focus();
      window.__APOLLO_ENGINE_READY__ = true;
    }
  } catch (error) {
    loading.textContent = error.message;
    window.__APOLLO_ENGINE_ERROR__ = error.message;
  }
})();
