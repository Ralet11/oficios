function readPath(target, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((current, key) => (current ? current[key] : undefined), target);
}

function guessFileName(asset) {
  if (asset.fileName) {
    return asset.fileName;
  }

  if (asset.uri) {
    const segments = asset.uri.split('/');
    return segments[segments.length - 1] || `upload-${Date.now()}.jpg`;
  }

  return `upload-${Date.now()}.jpg`;
}

async function uploadImageWithIntent(intent, asset) {
  const formData = new FormData();

  Object.entries(intent.upload.fields || {}).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  formData.append(intent.upload.fileField || 'file', {
    uri: asset.uri,
    name: guessFileName(asset),
    type: asset.mimeType || 'image/jpeg',
  });

  const response = await fetch(intent.upload.url, {
    method: intent.upload.method || 'POST',
    body: formData,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || 'No se pudo subir la imagen');
  }

  if (intent.resolve?.strategy === 'static') {
    return {
      height: asset.height || null,
      id: readPath(payload, intent.resolve.idField) || null,
      payload,
      url: intent.resolve.url,
      width: asset.width || null,
    };
  }

  if (intent.resolve?.strategy === 'json-field') {
    const url = readPath(payload, intent.resolve.urlField);

    if (!url) {
      throw new Error('La respuesta del proveedor no incluyo la URL final');
    }

    return {
      height: readPath(payload, intent.resolve.heightField) || asset.height || null,
      id: readPath(payload, intent.resolve.idField) || null,
      payload,
      url,
      width: readPath(payload, intent.resolve.widthField) || asset.width || null,
    };
  }

  throw new Error('No se pudo resolver el resultado del upload');
}

module.exports = {
  uploadImageWithIntent,
};
