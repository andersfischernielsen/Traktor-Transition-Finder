declare type Chord = 'Major' | 'Minor' | 'Invalid';
export declare class Song {
    BPM: Number;
    Title: string;
    Artist: string;
    Key: [Number, Chord];
    AudioId: string;
}
export declare class Edge {
    Weight: Number;
    From: Song;
    To: Song;
}
export declare class CollectionParser {
    static parseCollection(pathToCollection: string): Song[];
}
export declare class Graph {
    static buildGraph(list: Song[], numberOfEdges: Number): [Song, Edge[]][];
    static asMap(graph: [Song, Edge[]][]): Map<string, [Song, Edge[]]>;
}
export {};
