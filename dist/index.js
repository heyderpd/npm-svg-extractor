'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resume = exports.extractor = exports.init = undefined;

var _pytils = require('pytils');

var _anymatch = require('anymatch');

var _anymatch2 = _interopRequireDefault(_anymatch);

var _htmlParseRegex = require('html-parse-regex');

var _htmlParseRegex2 = _interopRequireDefault(_htmlParseRegex);

var _regexFinder = require('regex-finder');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var STAY = 'STAY';
var REMOVE = 'REMOVE';
var stateDict = { true: STAY, STAY: true, false: REMOVE, REMOVE: false };
var rules = {
  noCut: {
    '?xml': true, '!doctype': true, 'metadata': true },
  notAlone: {
    symbol: true, g: true, metadata: true }
};

var data = { ready: false };
var _debug = true;
var isWhitelist = void 0;

var createInOutLink = function createInOutLink() {
  (0, _pytils.map)(function (node) {
    if (node) {
      node.link.out = [];
      node.link.in = [];
    }
  }, data.list);
};

var reverseDependency = function reverseDependency() {
  (0, _pytils.map)(function (node) {
    if (node && !node.text) {
      var ref = node.attrs['xlink:href'];
      if (ref) {
        var dep = data.shortcut.id[ref.replace('#', '')];
        if (dep) {
          node.link.out.push(dep);
          dep.link.in.push(node);
        }
      }
    }
  }, data.list);
};

var burnLine = function burnLine(node, state) {
  var fireFrom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'inner';
  var notAlone = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var R = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

  if (R++ > 42) throw "Limit recursive exceeded in f.burnLine";
  if (!node) return;

  if (inRule('notAlone', node)) notAlone = true;
  setState(node, state);
  var fire = {};
  if (state == REMOVE) {
    // is blacklist > do remove cascate!
    fireFrom !== 'out' && (fire.in = node.link.in);
    fireFrom !== 'up' && (fire.down = node.link.childs);
  } else {
    // is whitelist > do unremove cascate!
    fireFrom !== 'down' && (fire.up = [node.link.father]);
    fireFrom !== 'in' && (fire.out = node.link.out);
    fireFrom !== 'up' && notAlone && (fire.down = node.link.childs);
  }
  (0, _pytils.map)(function (dir, fireTo) {
    (0, _pytils.map)(function (node) {
      return burnLine(node, state, fireTo, notAlone, R);
    }, dir);
  }, fire);
};

var stableTree = function stableTree(Objs) {
  var origin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : STAY;
  var state = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : STAY;
  var R = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  if (R++ > 42) throw "Limit recursive exceeded in f.stableTree";
  var childs = Objs.link.childs;
  if (childs && childs.length > 0) {
    (0, _pytils.map)(function (node) {
      origin === REMOVE && (state = REMOVE);
      state === REMOVE && setState(node, STAY);
      stableTree(node, node.state, state, R);
    }, childs);
  }
};

var fixRootText = function fixRootText() {
  data.tree.link.childs.map(function (node) {
    return node & node.text && setState(node, STAY);
  });
};

var setStateList = function setStateList() {
  var List = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  (0, _pytils.map)(function (node) {
    return setState(node, stateDict[!isWhitelist]);
  }, data.list);
  (0, _pytils.map)(function (id) {
    var node = data.shortcut.id[id];
    node && burnLine(node, stateDict[isWhitelist]);
  }, List);
  (0, _pytils.map)(function (node) {
    if (inRule('noCut', node)) {
      burnLine(node, STAY);
    }
  }, data.list);
  fixRootText();
  stableTree(data.tree);
};

var setState = function setState(node, state) {
  if (!inRule('noCut', node)) node.state = state;else node.state = STAY;
};

var inRule = function inRule(sub, node) {
  return node && !node.text && typeof node.tag === 'string' && rules[sub][node.tag.toLowerCase()];
};

var sortByStart = function sortByStart(a, b) {
  return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
};

var sortList = function sortList() {
  return data.list = data.list.sort(sortByStart);
};

var createJoinList = function createJoinList() {
  sortList();
  var preJoin = [];
  (0, _pytils.map)(function (node) {
    if (node.state === REMOVE) {
      preJoin.push({ s: node.start, e: node.end });
    }
  }, data.list);
  data.join = [];
  var oldE = 0;
  (0, _pytils.map)(function (pre) {
    var Item = { s: oldE, e: pre.s };
    if (Item.s > Item.e) {
      true && console.warn({ l: data.join.length, Item: Item });
      throw '(mid) concat erro s > e';
    }
    data.join.push(Item);
    oldE = pre.e;
  }, preJoin);
  var Item = { s: oldE, e: data.file.length };
  if (Item.s > Item.e) {
    if (_debug) console.warn({ l: data.join.length, Item: Item });
    throw '(end) concat erro s > e';
  }
  data.join.push(Item);
};

var createNewSVG = function createNewSVG() {
  var svg = '';
  (0, _pytils.map)(function (Part) {
    svg += data.file.slice(Part.s, Part.e);
  }, data.join);
  return svg;
};

var extract = function extract(list) {
  setStateList(list);
  createJoinList();
  return createNewSVG().replace(/[\r\n]/gm, '\n').replace(/\n[\s\n]+/gm, '\n');
};

var processAnymatch = function processAnymatch() {
  var anyList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var directoryList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  var extension = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

  var mapedId = resume('ID');
  var mathList = [],
      notMathList = [];
  (0, _pytils.map)(function (id) {
    if ((0, _anymatch2.default)(anyList, id)) {
      mathList.push(id);
    } else {
      notMathList.push(id);
    }
  }, mapedId);

  if (directoryList === undefined) {
    return mathList;
  } else {
    var resumeOf = isWhitelist ? 'FOUND' : 'NOT_FOUND';
    var dirList = (0, _regexFinder.find)({
      list: notMathList,
      extension: extension,
      path: directoryList,
      getResumeOf: resumeOf,
      pattern: '[^\\w-](__LIST__)[^\\w-]'
    });
    return mathList.concat(dirList);
  }
};

var init = exports.init = function init(svg) {
  data = (0, _htmlParseRegex2.default)(svg);
  data.file = svg;
  createInOutLink();
  reverseDependency();
  data.ready = true;
};

var extractor = exports.extractor = function extractor() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var whitelist = config.whitelist,
      directory = config.directory,
      extension = config.extension,
      list = config.list,
      svg = config.svg,
      ready = config.ready,
      debug = config.debug;
  // verify input

  isWhitelist = typeof whitelist !== 'boolean' ? true : whitelist;
  _debug = typeof debug !== 'boolean' ? true : debug;
  if (directory === undefined && list === undefined) {
    throw 'extractor: need param "list" OR "directory" defined, both are undefined';
  }
  if (list !== undefined && !Array.isArray(list)) {
    throw 'extractor: param "list" must be a array';
  }
  if (svg === undefined && !data.ready) {
    throw 'extractor: param "svg" is undefined';
  }

  // initialize
  _debug = debug;
  var start = void 0,
      crono = void 0;
  if (_debug) {
    start = +new Date();
  }
  if (!data.ready || svg !== undefined) {
    init(svg);
  }

  // create list from found in directory
  var extractList = processAnymatch(list, directory, extension

  // extract
  );var svge = extract(extractList

  // set resume
  );var percent = Math.floor(svge.length / svg.length * 10000) / 100;
  percent = Math.floor((100 - percent) * 100) / 100;
  data.resume = {
    mode: isWhitelist ? 'whitelist' : 'blacklist',
    list: list.length,
    svg: svg.length,
    svge: svge.length,
    percent: percent
  };
  if (_debug) {
    crono = (+new Date() - start) / 1000;
    var svgL = (svg.length / 1000).toFixed(3);
    var svgeL = (svge.length / 1000).toFixed(3);
    console.log('\n      SVG extracted in ' + crono + ' seconds\n      With a ' + data.resume.mode + ' using ' + list.length + ' itens.\n      Original file have ' + svgL + ' characters and new have ' + svgeL + ' (decrease ' + percent + '%)');
  }
  return svge;
};

var resume = exports.resume = function resume(from) {
  return from === 'ID' ? (0, _pytils.keys)(data.shortcut.id) : data.resume;
};
