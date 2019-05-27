cd ../electron
npm install
tsc

cd ../build-scripts
rm -r TraktorTransitionFinder.app
cp -r Electron.app TraktorTransitionFinder.app

cp -a ../electron TraktorTransitionFinder.app/Contents/Resources/app

cp ../electron/Info.plist TraktorTransitionFinder.app/Contents/Info.plist
cp ../electron/atom.icns TraktorTransitionFinder.app/Contents/Resources/atom.icns
