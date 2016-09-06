# SVG EXTRACTOR
Create new svg file from another with a whitelist or blacklist of required id.
Use in build to create small svg files.

## New feature
If you need create static svg, from a need of given directory.
Now you can pass the directory, and the module will find svg is called in it.
Finally will create a svg file. Have only itens is used in this directory.

## First Steps NO MORE!
Now is is in es2015, don't need first steps!
Thanks for:
[npm~lucasmreis](https://www.npmjs.com/~lucasmreis)

npm install svg-extractor

## To create a new file from another, using call's found in a directory
Example:
```javascript
import fs from 'fs';
import { extractor } from 'svg-extractor';

const svg = fs.readFileSync(`big-file.svg`, 'utf8');
const directory = './test/';

const svge = extractor({
  svg: svg,
  directory : directory,
});

fs.writeFileSync(`small-file.svg`, svge);
```

## To only return the itens in list
Example:
```javascript
import { extractor } from 'svg-extractor';

const svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'third'],
});

svge // new svg file extracted
```

## To not return the itens in list
Example:
```javascript
import { extractor } from 'svg-extractor';

const svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'third'],
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
  list: ['first', 'second', 'third'],
});

fs.writeFileSync(`small-file.svg`, svge);
```
