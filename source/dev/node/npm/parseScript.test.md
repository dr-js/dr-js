> initially this is a separated package called `npm-parse`

#### Why

using `scripts` in `package.json` is convenient, but there's bloat

try `npm run layer-0` with this somewhat extreme `package.json`:
```json
{
  "private": true,
  "name": "bloat-sample",
  "scripts": {
    "layer-0": "npm run layer-1",
    "layer-1": "npm run layer-2",
    "layer-2": "npm run layer-3",
    "layer-3": "npm run layer-4",
    "layer-4": "top",
    
    "layer-y0": "yarn run layer-y1",
    "layer-y1": "yarn run layer-y2",
    "layer-y2": "yarn run layer-y3",
    "layer-y3": "yarn run layer-y4",
    "layer-y4": "top",
    
    "layer-x0": "npm run layer-x1",
    "layer-x1": "yarn run layer-x2",
    "layer-x2": "npm run layer-x3",
    "layer-x3": "yarn run layer-x4",
    "layer-x4": "npx @dr-js/core --stc",
    
    "layer-combo": "npm run layer-0 && npm run layer-y0 && npm run layer-x0"
  }
}
```

do not exit the `top`, check the memory usage with `ps`, 
or best with `htop` (type `t` for tree mode), you'll see something like these: (npm@6.4.1/ubuntu@18.04.1)
```
  VIRT   RES   SHR S CPU% MEM%   TIME+  Command
  101M  6900  5888 S  0.0  1.4  0:00.15 │  └─ sshd: root@pts/0
 22784  5260  3480 S  0.0  1.1  0:00.04 │     └─ -bash
  780M 39520 24908 S  0.0  8.0  0:00.35 │        └─ npm
  4632   812   740 S  0.0  0.2  0:00.00 │           ├─ sh -c npm run layer-1
  780M 40148 25508 S  0.0  8.1  0:00.31 │           │  └─ npm
  4632   816   748 S  0.0  0.2  0:00.00 │           │     ├─ sh -c npm run layer-2
  780M 40168 25516 S  0.0  8.1  0:00.32 │           │     │  └─ npm
  4632   784   708 S  0.0  0.2  0:00.00 │           │     │     ├─ sh -c npm run layer-3
  780M 40272 25592 S  0.0  8.2  0:00.31 │           │     │     │  └─ npm
  4632   860   788 S  0.0  0.2  0:00.00 │           │     │     │     ├─ sh -c npm run layer-4
  779M 40056 25476 S  0.0  8.1  0:00.29 │           │     │     │     │  └─ npm
  4632   872   800 S  0.0  0.2  0:00.00 │           │     │     │     │     ├─ sh -c top
 41784  3768  3112 S  0.0  0.8  0:00.21 │           │     │     │     │     │  └─ top
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     ├─ npm
  779M 40056 25476 S  0.0  8.1  0:00.00 │           │     │     │     │     └─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     ├─ npm
  780M 40272 25592 S  0.0  8.2  0:00.00 │           │     │     │     └─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     ├─ npm
  780M 40168 25516 S  0.0  8.1  0:00.00 │           │     │     └─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     ├─ npm
  780M 40148 25508 S  0.0  8.1  0:00.00 │           │     └─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           ├─ npm
  780M 39520 24908 S  0.0  8.0  0:00.00 │           └─ npm
```

we have 5 `npm` wrapper for the `top` command in memory, 
the wrapper took about `80MB` of memory, 
while `top` itself use `3.7MB` (check the `RES` column)

and the shell (both `bash` and `sh`) use far less memory also 
(each took `5.2MB` and `0.8MB`)

try do the test with `yarn run layer-y0`, 
you'll get even bigger wrapper memory for about `230MB`

--- --- ---

but, directly run node script with `node`, or with `npx`, 
or global install and run do not have this big wrapper issue

here's some test result:
- with `npm run layer-x0` (5 mixed wrapper) memory increase about `160MB`
- with `npm run layer-x4` (1 npm wrapper) memory increase about `30MB`
- with `npx @dr-js/core --stc` memory increase about `16MB`
- with `npm i -g @dr-js/core && dr-js --stc` memory increase about `14MB`

for develop or package building, some extra memory is fine, 
even the occasional `npm upgrade box` is bearable

but in production, less dead memory is always good

--- --- ---

for above example, `npx @dr-js/dev --rs layer-0` will get you: 
```bash
npm run "layer-4"
```

and, `npx @dr-js/dev --rs layer-x0` will get you: 
```bash
npx @dr-js/core --stc
```

better yet, `npx @dr-js/dev --rs layer-combo` will get you: 
```bash
(
  npm run "layer-4"
  npm run "layer-y4"
  npx @dr-js/core --stc
)
```
