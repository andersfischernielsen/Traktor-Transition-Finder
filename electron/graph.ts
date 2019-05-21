import * as fs from 'fs';
import * as xmlStream from 'xml-stream';

type Chord = 'Major' | 'Minor' | 'Invalid';
export class Song {
  BPM: number;
  Title: string;
  Artist: string;
  Key: [number, Chord];
  AudioId: string;
}
export class Edge {
  Weight: number;
  From: Song;
  To: Song;
}
type Entry = {};

//The "punishment" for having a bad key transition.
const BADKEYWEIGHT = 15.0;

export class CollectionParser {
  ///Parse a .nml collection into a Song list.
  public static async parseCollection(pathToCollection: string) {
    const parseXML = (): Promise<Object[]> => {
      const stream = fs.createReadStream(pathToCollection);
      var xml = new xmlStream(stream);
      return new Promise((resolve, reject) => {
        const entries: Object[] = [];
        xml.on('endElement: ENTRY', (item: object) => {
          entries.push(item);
        });
        xml.on('endElement: COLLECTION', () => {
          resolve(entries);
        });
      });
    };

    ///Parse string keys from KEY.INFO attribute in NML.
    function parseKey(s: string): [number, Chord] {
      if (!s) return [0, 'Invalid'];
      const regex = new RegExp('d+');
      const result = regex.exec(s);
      if (!result) return [0, 'Invalid'];
      const key: Chord = s.indexOf('d') > 0 ? 'Major' : 'Minor';

      let num = +result[0];
      num = isNaN(num) ? 0 : num;
      return [num, key];
    }

    ///Parse integer key from MUSICAL_KEY attribute in NML to Key.
    function parseMusicalKey(k: number): [number, Chord] {
      switch (k) {
        case 0:
          return [1, 'Major'];
        case 1:
          return [8, 'Major'];
        case 2:
          return [3, 'Major'];
        case 3:
          return [10, 'Major'];
        case 4:
          return [5, 'Major'];
        case 5:
          return [12, 'Major'];
        case 6:
          return [7, 'Major'];
        case 7:
          return [2, 'Major'];
        case 8:
          return [9, 'Major'];
        case 9:
          return [4, 'Major'];
        case 10:
          return [11, 'Major'];
        case 11:
          return [6, 'Major'];
        case 12:
          return [10, 'Minor'];
        case 13:
          return [5, 'Minor'];
        case 14:
          return [12, 'Minor'];
        case 15:
          return [7, 'Minor'];
        case 16:
          return [2, 'Minor'];
        case 17:
          return [9, 'Minor'];
        case 18:
          return [4, 'Minor'];
        case 19:
          return [11, 'Minor'];
        case 20:
          return [6, 'Minor'];
        case 21:
          return [1, 'Minor'];
        case 22:
          return [8, 'Minor'];
        case 23:
          return [3, 'Minor'];
        default:
          return [0, 'Invalid'];
      }
    }

    ///Parse a given NML Entry into a Song type.
    function parseToSong(entry: object): Song {
      const get = function(obj: object, key: string) {
        return key.split('.').reduce(function(o, x) {
          return typeof o == 'undefined' || o === null ? o : o[x];
        }, obj);
      };

      const te = get(entry, 'TEMPO.$.BPM'); // xpath '//TEMPO/@BPM'
      const ti = get(entry, '$.TITLE'); // xpath '//ENTRY/@TITLE'
      const a = get(entry, '$.ARTIST'); // xpath '//ENTRY/@ARTIST'
      const mk = get(entry, 'MUSICAL_KEY.$.VALUE'); // xpath '//MUSICAL_KEY/@VALUE'
      const ik = get(entry, 'INFO.$.KEY'); // xpath '//INFO/@KEY'
      const id = get(entry, 'LOCATION.$.FILE'); // xpath '//LOCATION/@FILE'

      if (te == undefined || id == undefined) {
        return {
          BPM: 0.0,
          Title: '',
          Artist: '',
          Key: [0, 'Invalid'],
          AudioId: '',
        };
      }

      return mk != undefined
        ? ({
            BPM: +te,
            Title: ti,
            Artist: a,
            Key: parseMusicalKey(+mk),
            AudioId: id,
          } as Song)
        : ({
            BPM: +te,
            Title: ti,
            Artist: a,
            Key: parseKey(ik),
            AudioId: id,
          } as Song);
    }

    const entries = await parseXML();
    const songs = entries.map(parseToSong);
    return songs;
  }
}

export class Graph {
  ///Calculate weights for a (Song * Edge list) array.
  ///Create a graph (represented as a Song * Edge list array) from  a Song list.
  public static buildGraph(list: Song[], numberOfEdges: number) {
    ///Calculate the weight from a given Key to another Key.
    function weightForKey(key: [number, Chord], other: [number, Chord]) {
      const accountFor12 = (n: number) => (n % 12 == 0 ? 12 : n % 12);
      const plusOne = accountFor12(+key[0] + 1); //One key up
      const minusOne = accountFor12(+key[0] + 11); //One key down.
      const oneSemitone = accountFor12(+key[0] + 2); //One semitone up.
      const twoSemitones = accountFor12(+key[0] + 7); //two semitones up.
      function threeUpDown(k) {
        //If Chord.Minor, three keys UP, if Chord.Major three keys DOWN.
        if (k == 'Minor') return accountFor12(+key[0] + 3);
        else if (k == 'Major') return accountFor12(+key[0] + 9);
        return Number.MAX_VALUE;
      }

      //Create a list of all good key transitions.
      const lst = [
        plusOne,
        minusOne,
        oneSemitone,
        twoSemitones,
        threeUpDown(other[1]),
      ];
      //See if other key matches any of the good key transitions.
      let filtered = lst.filter((x) => other[0] == x);
      //If there were any matches, then it's a nice key transition.
      return filtered.length == 0 ? BADKEYWEIGHT : 0.0;
    }

    function generateEdge(fromSong: Song, toSong: Song): Edge {
      const bpmDifference = Math.abs(+fromSong.BPM - +toSong.BPM);
      const keyWeight = weightForKey(fromSong.Key, toSong.Key);

      const weight = bpmDifference + keyWeight;
      return { Weight: weight, From: fromSong, To: toSong };
    }

    function generateEdgesForSong(song: Song, songs: Song[]): [Song, Edge[]] {
      ///Take n elements from a given list until there are no more elements.
      function take(n: number, list: any[]) {
        const acc = [];
        function takeAcc(n, list: any[]): any[] {
          if (list.length <= 0) {
            return acc;
          }
          if (n > 0) {
            acc.push(list[0]);
            return takeAcc(n - 1, list.slice(1));
          } else {
            return acc;
          }
        }
        return takeAcc(n, list);
      }

      function createEdgesFromSong(songs: Song[]) {
        function compare(first: Edge, second: Edge) {
          if (first.Weight < second.Weight) return -1;
          if (first.Weight > second.Weight) return 1;
          return 0;
        }

        const otherSongs = songs.filter((s) => s != song);
        const withEdges = otherSongs.map((s) => generateEdge(song, s));
        const sorted = withEdges.sort((e1, e2) => compare(e1, e2));
        return take(numberOfEdges, sorted) as Edge[];
      }

      let result = createEdgesFromSong(songs);
      return [song, result];
    }

    const withEdges = list.map((entry) => generateEdgesForSong(entry, list));
    return withEdges;
  }

  ///Create a Map<audioId:string, (Song * Edge list)> from a Song * Edge list array.
  public static asMap(graph: [Song, Edge[]][]) {
    const map = new Map<string, [Song, Edge[]]>();
    graph.forEach((s) => (map[s[0].AudioId] = s));
    return map;
  }
}

module.exports = {
  CollectionParser: CollectionParser,
  Graph: Graph,
};
