cd ../Interface/electron
npm install
typings install debug --save
tsc

cd ../../build-scripts
rm -r TraktorTransitionFinder.app
cp -r Electron.app TraktorTransitionFinder.app

cp -a ../Interface/electron TraktorTransitionFinder.app/Contents/Resources/app

cp ../Interface/electron/Info.plist TraktorTransitionFinder.app/Contents/Info.plist
cp ../Interface/electron/atom.icns TraktorTransitionFinder.app/Contents/Resources/atom.icns
