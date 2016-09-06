'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*!
 * svg-extractor
 * Copyright (c) 2016 heyderpd <heyderpd@gmail.com>
 * ISC Licensed
 */

function reverseDependency() {
  doEach(data.List, function (node) {
    if (node.params['xlink:href']) {
      var ref = node.params['xlink:href'].replace('#', '');
      var dep = data.map.id[ref];
      if (dep) {
        node.link.out.push(dep);
        dep.link.in.push(node);
      }
    }
  });
}

function burnLine(node, state) {
  var fireFrom = arguments.length <= 2 || arguments[2] === undefined ? 'inner' : arguments[2];
  var notAlone = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
  var R = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

  if (R++ > 42) throw "Limit recursive exceeded in f.burnLine";
  if (!node) return;

  if (inRule('notAlone', node.tag)) notAlone = true;
  setState(node, state);
  var fire = {};
  if (state == REMOVE) {
    // is blacklist > do remove cascate!
    if (fireFrom !== 'out') fire.in = node.link.in;
    if (fireFrom !== 'up') fire.down = node.link.down;
  } else {
    // is whitelist > do unremove cascate!
    if (fireFrom !== 'down') fire.up = node.link.up;
    if (fireFrom !== 'in') fire.out = node.link.out;
    if (fireFrom !== 'up' && notAlone) fire.down = node.link.down;
  }
  doEach(fire, function (dir, fireTo) {
    doEach(dir, function (node) {
      burnLine(node, state, fireTo, notAlone, R);
    });
  });
}

function stableTree(Objs) {
  var origin = arguments.length <= 1 || arguments[1] === undefined ? STAY : arguments[1];
  var state = arguments.length <= 2 || arguments[2] === undefined ? STAY : arguments[2];
  var R = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

  if (R++ > 42) throw "Limit recursive exceeded in f.stableTree";

  doEach(Objs, function (node) {
    if (origin == REMOVE) state = REMOVE;
    if (state == REMOVE) setState(node, STAY);
    _typeof(node.inner) === 'object' ? stableTree(node.inner, node.state, state, R) : null;
  });
}

function setStateList() {
  var List = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

  doEach(data.List, function (node) {
    setState(node, stateDict[!isWhitelist]);
  });
  doEach(List, function (id) {
    var node = data.map.id[id];
    if (node) burnLine(node, stateDict[isWhitelist]);
  });
  doEach(data.List, function (node) {
    if (inRule('noCut', node.tag)) burnLine(node, STAY);
  });
  stableTree(data.Objs);
}

function setState(node, state) {
  if (!inRule('noCut', node.tag)) node.state = state;else node.state = STAY;
}

function inRule(sub, tag) {
  return typeof tag.toLowerCase === 'function' && rules[sub] !== undefined && rules[sub][tag.toLowerCase()];
}

function createJoinList() {
  var preJoin = [];
  doEach(data.List, function (node) {
    if (node.state === REMOVE) preJoin.push({ s: node.string.start, e: node.string.end });
  });
  data.join = [];
  var oldE = 0;
  doEach(preJoin, function (pre) {
    var Item = { s: oldE, e: pre.s };
    if (Item.s > Item.e) {
      if (debug) console.warn({ l: data.join.length, Item: Item });
      throw '(mid) concat erro s > e';
    }
    data.join.push(Item);
    oldE = pre.e;
  });
  var Item = { s: oldE, e: data.file.length };
  if (Item.s > Item.e) {
    if (debug) console.warn({ l: data.join.length, Item: Item });
    throw '(end) concat erro s > e';
  }
  data.join.push(Item);
}

function createNewSVG() {
  var svg = '';
  doEach(data.join, function (Part) {
    svg += data.file.slice(Part.s, Part.e);
  });
  return svg;
}

function initialize(svg) {
  data = Object.assign({ join: [], ready: false }, parse(svg));
  reverseDependency();
  data.ready = true;
}

function extract(list) {
  setStateList(list);
  createJoinList();
  var svge = createNewSVG();
  return clearBlankLines(svge);
}

function clearBlankLines(svg) {
  var no_lines = svg.replace(/(?:(?:\n[\t ]*)+)/gim, "\n");
  return no_lines.replace(/[\t ]{2,}/gim, " ");
}

function main() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  // verify input
  isWhitelist = typeof config.whitelist !== 'boolean' ? true : config.whitelist;
  if (config.directory === undefined && config.list === undefined) {
    throw 'extractor: need param "list" OR "directory" defined, both are undefined';
  }
  if (config.list !== undefined && !Array.isArray(config.list)) {
    throw 'extractor: param "list" must be a array';
  }
  if (config.svg === undefined && !data.ready) {
    throw 'extractor: param "svg" is undefined';
  }

  // initialize
  var start = void 0,
      crono = void 0;
  if (debug) {
    start = +new Date();
  }
  if (!data.ready || config.svg !== undefined) {
    initialize(config.svg);
  }

  // create list from found in directory
  if (config.directory) {
    config.list = find({
      list: getResume("ID"),
      path: config.directory,
      getResumeOf: 'NOT_FOUND'
    });
    isWhitelist = false;
  }

  // extract
  var svge = extract(config.list);

  // set resume
  var percent = Math.floor(svge.length / config.svg.length * 10000) / 100;
  percent = Math.floor((100 - percent) * 100) / 100;
  data.resume = {
    mode: isWhitelist ? 'whitelist' : 'blacklist',
    list: config.list.length,
    svg: config.svg.length,
    svge: svge.length,
    percent: percent
  };
  if (debug) {
    crono = (+new Date() - start) / 1000;
    console.log('\nSVG extracted in ' + crono + ' seconds\nWith a ' + data.resume.mode + ' using ' + config.list.length + ' itens.\nOriginal file have ' + config.svg.length / 1000 + ' charters and new decrease ' + percent + '%');
  }
  return svge;
}

function getResume(from) {
  if (from === "ID") {
    var list = [];
    doEach(data.map.id, function (value, id) {
      list.push(id);
    });
    return list;
  } else {
    return data.resume;
  }
}

var STAY = "STAY";
var REMOVE = "REMOVE";
var stateDict = { true: STAY, STAY: true, false: REMOVE, REMOVE: false };
var rules = {
  noCut: {
    'xml': true, '!doctype': true, 'metadata': true },
  notAlone: {
    symbol: true, g: true, metadata: true }
};

var data = { ready: false };
var debug = true;
var isWhitelist = void 0;

var doEach = function doEach(obj, func) {
  return Object.keys(obj).forEach(function (n) {
    return func(obj[n], n);
  });
};
var Copy = function Copy(Obj) {
  var base = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  return Object.assign(base, Obj);
};

var _require = require('html-parse-regex');

var parse = _require.parse;

var _require2 = require('regex-finder');

var find = _require2.find;


module.exports = {
  init: initialize,
  extractor: main,
  resume: getResume
};