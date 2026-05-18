const { platform } = require('os')

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.aiveditor.studio',
  productName: 'AI Video Editor',
  copyright: 'Copyright © 2025',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: [
    'out/**/*',
    '!out/**/*.map'
  ],
  extraResources: [
    {
      from: `node_modules/ffmpeg-static/${platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'}`,
      to: platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    }
  ],
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'resources/icon.ico'
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'resources/icon.icns',
    category: 'public.app-category.video'
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    icon: 'resources/icon.png',
    category: 'AudioVideo'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
}
