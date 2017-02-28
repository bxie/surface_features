/* NOTES:
 * Dependency to run: npm install esrefactor
 * ------
 * Esrefactor can only change one identifier at a time, and must look up
 * identifiers by position index (in the source code). This creates an issue
 * for changing multiple identifiers, because unless a new identifier name has
 * the same number of character as the previous name, all indexes are shifted.
 * This also creates an issue if you want to swap variable names, such as this
 * case which ends up renaming every variable to 'a':
 *  start  (a, b, c)
 *  a -> b (b, b, c)
 *  b -> c (c, c, c)
 *  c -> a (a, a, a)
 *
 * This has exponentional time complexity :(
 */

// Node stuff
// var escope = require('escope');
var esprima = require('esprima');
var estraverse = require('estraverse');
var esrefactor = require('esrefactor');

// Helper function that takes a list and returns an object of the identifiers
// mapped to themselves - ex. {"a": "a", "b": "b", "c": "c"}
function listToObj(list) {
  var obj = {};

  for(let i = 0; i < list.length; i++) {
    obj[list[i]] = list[i];
  }

  return obj;
}

// Returns an object of all identifiers in the code
function getIdentifiers(src, verbose = false) {
  var identifiers = [];
  var ast = esprima.parse(src); // Syntax tree from source

  // I'm pretty sure this traversal could be a function -
  // I think JS supports firstclass functions?
  estraverse.traverse(ast, {
    enter: function(node, parent) {
      if (node.type == 'Identifier' && !identifiers.includes(node.name)) {
        identifiers.push(node.name);
        if(verbose) console.log(node);
      }
    },
    leave: function(node, parent) {
      // This might not be needed at all?
    }
  });

  return listToObj(identifiers); // This format might be worth changing
}

// Returns the first index of the given identifier, -1 if not found
function getIdIndex(src, id, verbose = false) {
  var ast = esprima.parse(src, {range: true});
  var index = -1;

  estraverse.traverse(ast, {
    enter: function(node, parent) {
      if (node.type == 'Identifier' && node.name === id) {
        if(verbose) console.log("Found! " + node.range[0]);
        index = node.range[0];
        // The break function seems to be broken
        // estraverse.VisitorOption.Break;
      }
    },
    leave: function(node, parent) {
      // This might not be needed at all?
    }
  });

  return index;
}

// Helper function for 'renameIds'
function renameId(src, id, newId, verbose = false) {
  var ctx = new esrefactor.Context(src);
  if(verbose) console.log("Getting index for " + id);
  var index = getIdIndex(src, id, verbose);
  var idObj = ctx.identify(index);

  return ctx.rename(idObj, newId);
}

// Returns refactored source code will all identifiers renamed according to
// the passed object
function renameIds(src, ids, verbose = false) {
  var idArr = Object.keys(ids);
  var newIdArr = Object.values(ids);
  var newSrc = src;

  for(let i = 0; i < idArr.length; i++) {
    newSrc = renameId(newSrc, idArr[i], newIdArr[i], verbose);
    if(verbose) console.log(newSrc);
  }

  return newSrc;
}

// Some tests
var code1 = 'var a = 1; var b = 2; var c = a + b';
var code2 = 'var x = 1; for(let i = 0; i < 10; i++) {x += 2}';

var rename1 = {
  "a": "apple",
  "b": "banana",
  "c": "carrot"
}

var rename2 = {
  "x": "potato",
  "i": "tomato"
}

var idList1 = getIdentifiers(code1);
var idList2 = getIdentifiers(code2);

var output1 = renameIds(code1, rename1);
var output2 = renameIds(code2, rename2);

console.log(rename1);
console.log(output1);
