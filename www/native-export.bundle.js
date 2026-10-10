/* KT Companion - Android image export bridge
 *
 * Exposes window.KTNativeExport(blob, filename), used by www/index.html.
 * Uses the Capacitor Filesystem and Share plugins to create a temporary PNG
 * and open Android's share sheet, where the user can save/share the image.
 */
(function () {
  'use strict';

  function getPlugin(name) {
    var cap = window.Capacitor;
    if (!cap) return null;

    // Capacitor 7 commonly exposes registered plugins on Capacitor.Plugins.
    if (cap.Plugins && cap.Plugins[name]) return cap.Plugins[name];

    // Support installations that expose plugins through the registerPlugin API.
    if (typeof cap.registerPlugin === 'function') {
      try { return cap.registerPlugin(name); } catch (_) {}
    }
    return null;
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('Could not read the exported image.'));
      };
      reader.onload = function () {
        var result = String(reader.result || '');
        var comma = result.indexOf(',');
        if (comma < 0) {
          reject(new Error('Could not convert the exported image.'));
          return;
        }
        resolve(result.slice(comma + 1));
      };
      reader.readAsDataURL(blob);
    });
  }

  function safeFilename(name) {
    var value = String(name || 'kt-companion-export.png')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-');
    if (!/\.png$/i.test(value)) value += '.png';
    return value;
  }

  window.KTNativeExport = async function (blob, filename) {
    if (!(blob instanceof Blob)) {
      throw new Error('Image export did not produce a valid image.');
    }

    var filesystem = getPlugin('Filesystem');
    var share = getPlugin('Share');

    if (!filesystem || typeof filesystem.writeFile !== 'function') {
      throw new Error('Capacitor Filesystem plugin is unavailable. Rebuild the Android app after syncing plugins.');
    }
    if (!share || typeof share.share !== 'function') {
      throw new Error('Capacitor Share plugin is unavailable. Rebuild the Android app after syncing plugins.');
    }

    var name = safeFilename(filename);
    var path = 'kt-companion-exports/' + Date.now() + '-' + name;
    var base64 = await blobToBase64(blob);

    // Cache is temporary and does not require Android storage permissions.
    var saved = await filesystem.writeFile({
      path: path,
      data: base64,
      directory: 'CACHE',
      recursive: true
    });

    var fileUri = saved && saved.uri;
    if (!fileUri) {
      throw new Error('The image was written, but Android did not return a file URI.');
    }

    await share.share({
      title: 'KT Companion score export',
      text: 'Score export from KT Companion',
      files: [fileUri],
      dialogTitle: 'Save or share score image'
    });

    return { uri: fileUri, filename: name };
  };
})();
