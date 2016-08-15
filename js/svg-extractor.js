
function parseData(Text, Dep, Start = 0, R = 0) {
  if(typeof(Text) !== 'string')
    throw "Try Parse Object as a String";
  if(R++ > 42)
    throw "Limit recursive exceeded in f.parseData";

  const Pattern = new RegExp('<(\\w+)(?:[^>]+?id="([^"]+))?([^>]+?\\/|\\b[\\w\\W]+?\\/\\1)>',
                             'gim');
  let Inner = [];
  let result = null;
  while ((result = Pattern.exec(Text)) !== null) {
    // push to data.Objs
    const id = result[2] === undefined ? null : result[2];
    const tag = result[1] === undefined ? null : result[1];
    let Math = {
        key : data.uKey++,
      inner : null,
        out : null,
      start : Start +result.index,
        end : Start +Pattern.lastIndex
    }
    let ref = Math.end -result[3].length -1;
    Math.inner = parseData(result[3], Math.key, ref, R);
    if(typeof(Math.inner) === 'string')
      Math.out = getRefId(Math.inner);
    Inner.push(Math);
    // push to data.List
    data.List[Math.key] = {
          id : id,
         tag : tag,
        link : {
                up : [],
              down : [],
               out : [],
                in : []
              },
         Obj : Math,
      remove : true
    }
    if(typeof(Math.inner) === 'object')
      Object.keys(Math.inner).forEach((key)=>{
        let dep = Math.inner[key].key;
        data.List[Math.key].link.down.push(  dep);
        data.List[dep     ].link.up.push(Math.key);
      });
    // push to data.Keys
    if(id !== null)
      data.Keys[String(id)] = Math.key;
  }
  if(Inner.length)
    return Inner;
  else
    return Text;
}

function getRefId(Text) {
  const Pattern = new RegExp('xlink:href="#(.+?)"',
                             'gim');
  let result = null;
  if((result = Pattern.exec(Text))!== null){
    return result[1];
  } else {
    return null;
  }
}

function reverseDependency() {
  Object.keys(data.List).forEach((key)=>{
    let Item = data.List[key];
    let dep = data.Keys[Item.Obj.out];
    if(dep !== undefined){
      data.List[key].link.out.push(dep);
      data.List[dep].link.in.push(key);
    }
  });
}

function recursiveListSetRemove(key, remove, moveFrom, R = 0) {
  if(R++ > 42)
    throw "Limit recursive exceeded in f.recursiveListSetRemove";
  if(data.List[key] === undefined)
    return;

  const tag = data.List[key].tag;
  data.List[key].remove = remove;
  let fire = {};
  if(remove){ // is blacklist > remove!
    if(moveFrom !== 'in')   fire.down = data.List[key].link.down;
    if(moveFrom !== 'down') fire.in = data.List[key].link.in;
  } else {    // is whitelist > unremove!
    if(moveFrom !== 'down') fire.up = data.List[key].link.up;
    if(moveFrom !== 'in')   fire.out = data.List[key].link.out;
    if(moveFrom !== 'up' && notAloneTags[tag]) fire.down = data.List[key].link.down;
  }
  Object.keys(fire).forEach((dir)=>{
    Object.keys(fire[dir]).forEach((key)=>{
      recursiveListSetRemove(fire[dir][key], remove, dir, R);
    });
  });
}

function recursiveObjsSetRemove(Objs, origin = true, remove = false, R = 0) {
  if(R++ > 42)
    throw "Limit recursive exceeded in f.recursiveObjsSetRemove";

  Object.keys(Objs).forEach((nodo)=>{
    let key = Objs[nodo].key;
    if(!origin)
      remove = true;
    myOrigin = !data.List[key].remove;
    if(remove)
      data.List[key].remove = false;
    let inner = typeof(Objs[nodo].inner) === 'object' ? Objs[nodo].inner : {};
    recursiveObjsSetRemove(inner, myOrigin, remove, R);
  });
}

function setRemoveList(List = [], isWhitelist) {
  //console.log('setRemoveList', isBlackList);
  if(!isWhitelist){
    Object.keys(data.List).forEach((key)=>{
      data.List[key].remove = false;
    });
  }
  data.v = 0;
  //console.log('data1', Object.create(data) );
  Object.keys(List).forEach((i)=>{
    let key = data.Keys[List[i]];
    if(key !== undefined)
      recursiveListSetRemove(key, !isWhitelist);
  });
  data.v = 2;
  recursiveObjsSetRemove(data.Objs);
}

function createJoinList() {
  let preJoin = [];
  Object.keys(data.List).forEach((key)=>{
    let Item = data.List[key];
    if(Item.remove)
      preJoin.push({s: Item.Obj.start, e: Item.Obj.end});
  });
  data.join = [];
  let oldE = 0;
  Object.keys(preJoin).forEach((i)=>{
    let Item = {s: oldE, e: preJoin[i].s};
    if(Item.s > Item.e) {
      if(debug)
        console.warn({data, Item});
      throw 'concat erro s > e';
    }
    data.join.push(Item);
    oldE = preJoin[i].e;
  });
  let Item = {s: oldE, e: data.svg.length};
  if(Item.s > Item.e) {
    if(debug)
      console.warn({data, Item});
    throw 'concat erro s > e';
  }
  data.join.push(Item);
}

function createNewSVG() {
  let svg = '';
  Object.keys(data.join).forEach((i)=>{
    let Part = data.join[i];
    svg += data.svg.slice(Part.s, Part.e);
  });
  return svg;
}

function initialize(svg) {
  data = { uKey:0, Keys:{}, List:{}, Objs:{}, svg:svg, join:[], resume:{}, ready: false };
  data.Objs = parseData(svg, null);
  reverseDependency();
  data.ready = true;
}

function extract(list) {
  setRemoveList(list, isWhitelist);
  createJoinList();
  return createNewSVG();
}

function main(config = {}) {
  // verify input
  debug       = config.debug === undefined ? false : config.debug;
  isWhitelist = typeof(config.whitelist) !== 'boolean' ? true : config.whitelist;
  if(config.list === undefined) { throw 'extractor: param "list" is undefined'; };
  if(config.svg  === undefined && !data.ready) { throw 'extractor: param "svg" is undefined'; };

  if(debug) { const start = +new Date() };
  if(!data.ready || config.svg !== undefined) { initialize(config.svg); }
  const svge = extract(config.list);

  let percent = Math.floor(svge.length /config.svg.length *10000) /100;
  percent = Math.floor((100 -percent) *100) /100;
  data.resume.mode = (isWhitelist) ? 'whitelist' : 'blacklist';
  data.resume.list = config.list.length;
  data.resume.svg  = config.svg.length;
  data.resume.svge = svge.length;
  data.resume.percent = percent;

  if(debug) { console.log(`\nSVG extracted in ${(+new Date() -start) /1000} seconds\nWith a ${isWhitelist} using ${list.length} itens.\nOriginal file have ${svg.length/1000} charters and new decrease ${percent}%`); }
  return svge;
}

function getResume() {
  return data.resume;
}

const notAloneTags = {symbol:true, g:true, metadata:true};
let data = { ready: false }
let debug = false;
let isWhitelist;

module.exports = {
  init:      initialize, 
  extractor: main,
  resume:    getResume
}
