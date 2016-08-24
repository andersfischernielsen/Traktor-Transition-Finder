cd ../Graph/
nuget restore
xbuild /p:Configuration=Release ../Graph/TraktorAutoNextSong.sln
export PATH=/Library/Frameworks/Mono.framework/Commands:$PATH
export AS="as -arch i386"
export CC="cc -arch i386 -framework CoreFoundation -lobjc -liconv"
cd Traktor/bin/Release/
mkbundle -o Traktor Traktor.exe Suave.dll FsPickler.dll FSharp.Data.dll FSharp.Core.dll Newtonsoft.Json.dll --deps
