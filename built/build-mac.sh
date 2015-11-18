cp -a ../electron/. ./TraktorAutoNextSong.app/Contents/Resources/app/
xbuild /p:Configuration=Release ../Project/TraktorAutoNextSong.sln
cp -a ../Project/Traktor/bin/Release ./TraktorAutoNextSong.app/Contents/Resources/
cp ../electron/Info.plist ./TraktorAutoNextSong.app/Contents/Info.plist