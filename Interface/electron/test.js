var graph = require('./graph.js');
var parsed = graph.parseCollection('/Users/Anders/Documents/Native Instruments/Traktor 2.10.2/collection.nml');
var result = graph.buildGraph(parsed, 5);
var asMap = graph.asMap(result);
console.log("test");