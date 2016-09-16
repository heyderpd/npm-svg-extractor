
/*!
 * svg-extractor
 * Copyright (c) 2016 heyderpd <heyderpd@gmail.com>
 * ISC Licensed
 */

function reverseDependency() {
  doEach(data.List, node => {
    if (node.params['xlink:href']) {
      var ref = node.params['xlink:href'].replace('#', '')
      let dep = data.map.id[ref]
      if (dep){
        node.link.out.push(dep)
        dep.link.in.push(node)
      }
    }
  })
}

function burnLine(node, state, fireFrom = 'inner', notAlone = false, R = 0) {
  if (R++ > 42)
    throw "Limit recursive exceeded in f.burnLine"
  if (!node)
    return

  if (inRule('notAlone', node.tag))
    notAlone = true
  setState(node, state)
  let fire = {}
  if (state == REMOVE){ // is blacklist > do remove cascate!
    if (fireFrom !== 'out')  fire.in   = node.link.in
    if (fireFrom !== 'up')   fire.down = node.link.down
  } else { // is whitelist > do unremove cascate!
    if (fireFrom !== 'down') fire.up   = node.link.up
    if (fireFrom !== 'in')   fire.out  = node.link.out
    if (fireFrom !== 'up' && notAlone) fire.down = node.link.down
  }
  doEach(fire, (dir, fireTo) => {
    doEach(dir, node => {
      burnLine(node, state, fireTo, notAlone, R)
  }) })
}

function stableTree(Objs, origin = STAY, state = STAY, R = 0) {
  if (R++ > 42)
    throw "Limit recursive exceeded in f.stableTree"

  doEach(Objs, node => {
    if (origin == REMOVE)
      state = REMOVE
    if (state == REMOVE)
      setState(node, STAY)
    typeof(node.inner) === 'object'
      ? stableTree(node.inner, node.state, state, R)
      : null
  })
}

function setStateList(List = []) {
  doEach(data.List, node => {
    setState(node, stateDict[!isWhitelist])
  })  
  doEach(List, id => {
    let node = data.map.id[id]
    if (node)
      burnLine(node, stateDict[isWhitelist])
  })
  doEach(data.List, node => {
    if (inRule('noCut', node.tag))
      burnLine(node, STAY)
  })
  stableTree(data.Objs)
}

function setState(node, state) {
  if (!inRule('noCut', node.tag))
    node.state = state
  else
    node.state = STAY
}

function inRule(sub, tag) {
  return typeof(tag.toLowerCase) === 'function' && rules[sub] !== undefined && rules[sub][tag.toLowerCase()]
}

function createJoinList() {
  let preJoin = []
  doEach(data.List, node => {
    if (node.state === REMOVE)
      preJoin.push({s: node.string.start, e: node.string.end})
  })
  data.join = []
  let oldE = 0
  doEach(preJoin, pre => {
    let Item = {s: oldE, e: pre.s}
    if (Item.s > Item.e) {
      if (debug)
        console.warn({l:data.join.length, Item})
      throw '(mid) concat erro s > e'
    }
    data.join.push(Item)
    oldE = pre.e
  })
  let Item = {s: oldE, e: data.file.length}
  if (Item.s > Item.e) {
    if (debug)
      console.warn({l:data.join.length, Item})
    throw '(end) concat erro s > e'
  }
  data.join.push(Item)
}

function createNewSVG() {
  let svg = ''
  doEach(data.join, Part => {
    svg += data.file.slice(Part.s, Part.e)
  })
  return svg
}

function initialize(svg) {
  data = Object.assign({ join: [], ready: false }, parse(svg) )
  reverseDependency()
  data.ready = true
}

function extract(list) {
  setStateList(list)
  createJoinList()
  return createNewSVG()
    .replace(/[ \t]+/gim, '')
    .replace(/((?:[ \t]*\n)+)/gim, '\n')
}

function processAnymatch(anyList = [], directoryList = undefined, extension = undefined) {
  let mapedId = getResume("ID")
  let mathList = [], notMathList = []
  doEach(mapedId, id => {
    if( anymatch(anyList, id) ){
      mathList.push(id)
    } else {
      notMathList.push(id)
    }
  })

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

function main(config = {}) {
  // verify input
  isWhitelist = typeof(config.whitelist) !== 'boolean' ? true : config.whitelist
  if (config.directory === undefined && config.list === undefined) { throw 'extractor: need param "list" OR "directory" defined, both are undefined' }
  if (config.list !== undefined && !Array.isArray(config.list)) { throw 'extractor: param "list" must be a array' }
  if (config.svg  === undefined && !data.ready) { throw 'extractor: param "svg" is undefined' }

  // initialize
  let start, crono
  if (debug) { start = +new Date() }
  if (!data.ready || config.svg !== undefined) { initialize(config.svg) }

  // create list from found in directory
  const extractList = processAnymatch(config.list,
                                      config.directory,
                                      config.extension)

  // extract
  const svge = extract(extractList)

  // set resume
  let percent = Math.floor(svge.length /config.svg.length *10000) /100
  percent = Math.floor((100 -percent) *100) /100
  data.resume = {
    mode: (isWhitelist) ? 'whitelist' : 'blacklist',
    list: config.list.length,
    svg:  config.svg.length,
    svge: svge.length,
    percent: percent
  }
  if (debug) {
    crono = (+new Date() -start) /1000
    console.log(`\nSVG extracted in ${crono} seconds\nWith a ${data.resume.mode} using ${config.list.length} itens.\nOriginal file have ${config.svg.length/1000} charters and new decrease ${percent}%`)
  }
  return svge
}

function getResume(from) {
  if (from === "ID") {
    var list = []
    doEach(data.map.id, (node, id) => {
      list.push(id)
    })
    return list;
  } else {
    return data.resume;    
  }
}

const STAY = "STAY"
const REMOVE = "REMOVE"
const stateDict = { true: STAY, STAY: true, false: REMOVE, REMOVE: false }
const rules = {
  noCut: {
    'xml': true, '!doctype': true, 'metadata': true},
  notAlone: {
    symbol: true, g: true, metadata: true }
}

let data = { ready: false }
let debug = true
let isWhitelist

const doEach = (obj, func) => Object.keys(obj).forEach(n => func(obj[n], n))
const Copy = (Obj, base = {}) => Object.assign(base, Obj)

const  anymatch = require('anymatch');
const { parse } = require('html-parse-regex')
const { find }  = require('regex-finder')

module.exports = {
  init:      initialize, 
  extractor: main,
  resume:    getResume
}
