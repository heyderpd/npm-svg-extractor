# SVG EXTRACTOR
Create new svg file from another with a whitelist or blacklist of required id.
Use in build to create small svg files.

##First Steps
* install node 6
* touch .babelrc
and write in:
```javascript
{
  "presets": ["es2015"]
}
```
* npm install svg-extractor

##To only return the itens in list
Example:
```javascript
import { extractor } from 'svg-extractor';

const svge = extractor({
  svg: ...ram of svg file...,
  list: ['first', 'second', 'third'],
});

svge // new svg file extracted
```

##To not return the itens in list
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

##To create a new file from another
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
