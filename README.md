# SVG EXTRACTOR
Create new svg file from another with a whitelist or blacklist of required id.
Use in build to create small svg files.

[![NPM](https://nodei.co/npm/svg-extractor.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/svg-extractor/)
[![NPM](https://nodei.co/npm-dl/svg-extractor.png?height=3&months=1)](https://nodei.co/npm-dl/svg-extractor/)

## New feature (bug fixed!!!)
* Now whitelist and blacklist acepct anymatch!
* You can use list and directory at the same time.
* Can pass multiple directory using array.
* Can pass extension of files you need find call of id
* If you need create static svg, from a need of given directory.
Now you can pass the directory, and the module will find svg is called in it.
Finally will create a svg file. Have only itens is used in this directory.

## First Steps NO MORE!
Now use es2015, don't need first steps!
Thanks for:
[npm~lucasmreis](https://www.npmjs.com/~lucasmreis)

npm install svg-extractor

## To create a new file from another, using call's found in a directory and whitelist

In this case the program will map all id in svg file, filter this using the whitelist you define. And Finally will find all call's in directory's to create the rest of list. In blacklist mode occurs in reverse, only on the absence of calls from id's. Creating the desired list at the end.
Example:
```javascript
const svg = fs.readFileSync(`big-file.svg`, 'utf8');
const directory = [ './test/', './abc/def' ];
const list = [ 'abc', 'a*', '\d+' ]

const svge = extractor({
  svg: svg,
  list : list,
  directory : directory,
  extension: ['html', 'js', 'json'], // (optional)
  whitelist : true
});
```

## To only return the itens in list
Example:
```javascript
import { extractor } from 'svg-extractor';

const svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'a*', '\d+'],
});

svge // new svg file extracted
```

## To not return the itens in list
Example:
```javascript
import { extractor } from 'svg-extractor';

const svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'a*', '\d+'],
  whitelist: false,
});

svge // new svg file extracted
```

## To create a new file from another
Example:
```javascript
import fs from 'fs';
import { extractor } from 'svg-extractor';

const svg = fs.readFileSync(`big-file.svg`, 'utf8');

const svge = extractor({
  svg: svg,
  list: ['first', 'second', 'a*', '\d+'],
});

fs.writeFileSync(`small-file.svg`, svge);
```
