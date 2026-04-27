const ImagePicker = require('expo-image-picker');
const { api } = require('./api');
const { uploadImageWithIntent } = require('./mediaUpload');

function getPickerMediaTypes() {
  return ImagePicker.MediaTypeOptions?.Images || ['images'];
}

async function requestPickerPermission(source) {
  const response =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!response.granted) {
    throw new Error(
      source === 'camera'
        ? 'Activa el permiso de camara para sacar fotos.'
        : 'Activa el permiso de galeria para elegir fotos.',
    );
  }
}

async function pickImageAssets(source, options = {}) {
  await requestPickerPermission(source);

  const pickerOptions = {
    allowsEditing: false,
    allowsMultipleSelection: (options.selectionLimit || 1) > 1,
    mediaTypes: getPickerMediaTypes(),
    quality: options.quality || 0.82,
    selectionLimit: options.selectionLimit || 1,
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets;
}

async function uploadImageAssetWithScope(asset, scope, token) {
  const intentResponse = await api.createImageUploadIntent(
    {
      scope,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    },
    token,
  );

  return uploadImageWithIntent(intentResponse.data, asset);
}

module.exports = {
  pickImageAssets,
  requestPickerPermission,
  uploadImageAssetWithScope,
};
