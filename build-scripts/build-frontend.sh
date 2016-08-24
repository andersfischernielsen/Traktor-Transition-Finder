cd ../Interface/electron
npm install
cd ../../build
cp -r Electron.app TraktorAutoNextSong.app
cp -a ../Interface/electron/. TraktorAutoNextSong.app/Contents/Resources/app/
cp -a ../Graph/Traktor/bin/Release TraktorAutoNextSong.app/Contents/Resources/app/
cp ../Interface/electron/Info.plist TraktorAutoNextSong.app/Contents/Info.plist
cp ../Interface/electron/atom.icns TraktorAutoNextSong.app/Contents/Resources/atom.icns
