declare type Chord = 'Major' | 'Minor' | 'Invalid';
export declare class Song {
    BPM: number;
    Title: string;
    Artist: string;
    Key: [number, Chord];
    AudioId: string;
}
export declare class Edge {
    Weight: number;
    From: Song;
    To: Song;
}
export declare class CollectionParser {
    static parseCollection(pathToCollection: string): Promise<Song[]>;
}
export declare class Graph {
    static buildGraph(list: Song[], numberOfEdges: number): [Song, Edge[]][];
    static asMap(graph: [Song, Edge[]][]): Map<string, [Song, Edge[]]>;
}
export {};
