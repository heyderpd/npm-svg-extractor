
/*!
 * svg-extractor
 * Copyright (c) 2016 heyderpd <heyderpd@gmail.com>
 * ISC Licensed
 */

const STAY = 'STAY'
const REMOVE = 'REMOVE'
const stateDict = { true: STAY, STAY: true, false: REMOVE, REMOVE: false }
const rules = {
  noCut: {
    'xml': true, '!doctype': true, 'metadata': true},
  notAlone: {
    symbol: true, g: true, metadata: true }
}

let data = { ready: false }
let _debug = true
let isWhitelist

const { map, keys } = require('pytils')
const anymatch  = require('anymatch')
const { parse } = require('html-parse-regex')
const { find }  = require('regex-finder')

const reverseDependency = () => {
  map(
    node => {
      if (node.params['xlink:href']) {
        var ref = node.params['xlink:href'].replace('#', '')
        let dep = data.map.id[ref]
        if (dep){
          node.link.out.push(dep)
          dep.link.in.push(node)
        }
      }
    },
    data.List)
}

const burnLine = (node, state, fireFrom = 'inner', notAlone = false, R = 0) => {
  if (R++ > 42)
    throw "Limit recursive exceeded in f.burnLine"
  if (!node)
    return

  if (inRule('notAlone', node.tag))
    notAlone = true
  setState(node, state)
  let fire = {}
  if (state == REMOVE){ // is blacklist > do remove cascate!
    fireFrom !== 'out' && (fire.in   = node.link.in)
    fireFrom !== 'up'  && (fire.down = node.link.down)
  } else { // is whitelist > do unremove cascate!
    fireFrom !== 'down' && (fire.up   = node.link.up)
    fireFrom !== 'in'   && (fire.out  = node.link.out)
    fireFrom !== 'up' && notAlone && (fire.down = node.link.down)
  }
  map(
    (dir, fireTo) => {
      map(
        node => burnLine(node, state, fireTo, notAlone, R),
        dir)
    },
    fire)
}

const stableTree = (Objs, origin = STAY, state = STAY, R = 0) => {
  if (R++ > 42)
    throw "Limit recursive exceeded in f.stableTree"

  map(
    node => {
      origin === REMOVE && (state = REMOVE)
      state  === REMOVE && setState(node, STAY)
      if (typeof(node.inner) === 'object') {
        stableTree(node.inner, node.state, state, R)
      }
    },
    Objs)
}

const setStateList = (List = []) => {
  map(
    node => setState(node, stateDict[!isWhitelist]),
    data.List)
  map(
    id => {
      let node = data.map.id[id]
      node && burnLine(node, stateDict[isWhitelist])
    },
    List)
  map(
    node => {
      if (inRule('noCut', node.tag)) {
        burnLine(node, STAY)
      }
    },
    data.List)
  stableTree(data.Objs)
}

const setState = (node, state) => {
  if (!inRule('noCut', node.tag))
    node.state = state
  else
    node.state = STAY
}

const inRule = (sub, tag) => {
  return typeof(tag.toLowerCase) === 'function' && rules[sub] !== undefined && rules[sub][tag.toLowerCase()]
}

const createJoinList = () => {
  let preJoin = []
  map(
    node => {
      if (node.state === REMOVE) {
        preJoin.push({s: node.string.start, e: node.string.end})
      }
    },
    data.List)
  data.join = []
  let oldE = 0
  map(
    pre => {
      let Item = {s: oldE, e: pre.s}
      if (Item.s > Item.e) {
        _debug && console.warn({l:data.join.length, Item})
        throw '(mid) concat erro s > e'
      }
      data.join.push(Item)
      oldE = pre.e
    },
    preJoin)
  let Item = {s: oldE, e: data.file.length}
  if (Item.s > Item.e) {
    if (_debug)
      console.warn({l:data.join.length, Item})
    throw '(end) concat erro s > e'
  }
  data.join.push(Item)
}

const createNewSVG = () => {
  let svg = ''
  map(
    Part => {
      svg += data.file.slice(Part.s, Part.e)
    },
    data.join)
  return svg
}

const extract = list => {
  setStateList(list)
  createJoinList()
  return createNewSVG()
    .replace(/[\r\n]/gm, '\n')
    .replace(/\n[ \t\n]+/gm, '\n')
}

const processAnymatch = (anyList = [], directoryList = undefined, extension = undefined) => {
  let mapedId = resume('ID')
  let mathList = [], notMathList = []
  map(
    id => {
      if( anymatch(anyList, id) ){
        mathList.push(id)
      } else {
        notMathList.push(id)
      }
    },
    mapedId)

  if (directoryList === undefined) {
    return mathList
  } else {
    const resumeOf = isWhitelist ? 'FOUND' : 'NOT_FOUND'
    const dirList = find({
        list: notMathList,
        extension: extension,
        path: directoryList,
        getResumeOf: resumeOf,
        pattern: '[^\\w-](__LIST__)[^\\w-]'
      })
    return mathList.concat(dirList)
  }
}

export const init = svg => {
  data = Object.assign({ join: [], ready: false }, parse(svg) )
  reverseDependency()
  data.ready = true
}

export const extractor = (config = {}) => {
  const { whitelist, directory, extension, list, svg, ready, debug } = config
  // verify input
  isWhitelist = typeof(whitelist) !== 'boolean' ? true : whitelist
  _debug = typeof(debug) !== 'boolean' ? true : debug
  if (directory === undefined && list === undefined) { throw 'extractor: need param "list" OR "directory" defined, both are undefined' }
  if (list !== undefined && !Array.isArray(list)) { throw 'extractor: param "list" must be a array' }
  if (svg  === undefined && !data.ready) { throw 'extractor: param "svg" is undefined' }

  // initialize
  _debug = debug
  let start, crono
  if (_debug) { start = +new Date() }
  if (!data.ready || svg !== undefined) { init(svg) }

  // create list from found in directory
  const extractList = processAnymatch(
    list,
    directory,
    extension)

  // extract
  const svge = extract(extractList)

  // set resume
  let percent = Math.floor(svge.length /svg.length *10000) /100
  percent = Math.floor((100 -percent) *100) /100
  data.resume = {
    mode: (isWhitelist) ? 'whitelist' : 'blacklist',
    list: list.length,
    svg:  svg.length,
    svge: svge.length,
    percent: percent
  }
  if (_debug) {
    crono = (+new Date() -start) /1000
    let svgL  = (svg.length /1000).toFixed(3)
    let svgeL = ( svge.length /1000).toFixed(3)
    console.log(`
      SVG extracted in ${crono} seconds
      With a ${data.resume.mode} using ${list.length} itens.
      Original file have ${svgL} characters and new have ${svgeL} (decrease ${percent}%)`)
  }
  return svge
}

export const resume = from => from === 'ID'
  ? keys(data.map.id)
  : data.resume
