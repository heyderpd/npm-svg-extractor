# SVG EXTRACTOR
Create new svg file from another with a whitelist or blacklist of required id.
Use in build to create small svg files.

## USING NEW PARSER - MANY FIXED BUGS!!
## TWICE AS FAST - All process have a avg of 11 mileseconds!!!
```javascript
npm install svg-extractor
```

## I will help if you have any difficulty =)
Contact me by [github:heyderpd](https://github.com/heyderpd). I'll be glad to help you.

[![NPM](https://nodei.co/npm/svg-extractor.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/svg-extractor/)
[![NPM](https://nodei.co/npm-dl/svg-extractor.png?height=3&months=2)](https://nodei.co/npm-dl/svg-extractor/)

## New feature (bug fix of space remover)
* Now whitelist and blacklist acepct anymatch!
* You can use list and directory at the same time or only a directory!
* Can pass multiple directory using array.
* Can pass extension of files you need find call of id
* If you need create static svg, from a need of given directory.
Now you can pass the directory, and the module will find svg is called in it.
Finally will create a svg file. Have only itens is used in this directory.

## Thanks for [npm~lucasmreis](https://www.npmjs.com/~lucasmreis)

## To create a new file from another, using call's found in a directory and whitelist
If is whitelist program will use list (of anymatch)  to select id's. And will search call's in directories, using the rest of id's found in svg. Finally create a big whitelist to extract!
Else is a blacklist will use list (of anymatch) to remove id's. And will search id's is not called in directories, using the of rest id's found in svg. Finally create a big blacklist to extract!
You don't need pass a list if pass a directory.
The var list accept any values of [anymath](https://www.npmjs.com/package/anymatch) module
Example:
```javascript
const { extractor } = require('svg-extractor')

let svg = fs.readFileSync(`big-file.svg`, 'utf8');
let directory = [ './test/', './abc/def' ];
let list = [ 'abc', 'a*', '\\d+', functionA ]

let svge = extractor({
  svg: svg,
  list: list,
  directory: directory,
  extension: ['html', 'js', 'json'], // (optional)
  whitelist: true // (optional default true)
});
```

## To only return the itens in list
Example:
```javascript
let svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'a*', '\\d+', functionA],
  whitelist: true // (optional default true)
});
```

## To not return the itens in list
Example:
```javascript
let svge = extractor({
  ... same as the previous example ...
  whitelist: false
});
```

## To create a new file from another
Example:
```javascript
let svg = fs.readFileSync(`big-file.svg`, 'utf8');
let svge = extractor(...);
fs.writeFileSync(`small-file.svg`, svge);
```
