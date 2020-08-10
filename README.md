# babel-plugin-auto-import


Convert global variables to import statements

- [Using with Create React App](#using-with-create-react-app)


## Examples

### Example 1

**.babelrc**

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        { "default": "React", "path": "react" }
      ]
    }
  ]]
}
```

**In**

```javascript
React.createElement("div", null, []);
```

**Out**

```javascript
import React from "react";

React.createElement("div", null, []);
```

### Example 2

**.babelrc**

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        { "default": "React", "members": ["Component"], "path": "react" }
      ]
    }
  ]]
}
```

**In**

```javascript
class MyComponent extends Component { }
```

**Out**

```javascript
import { Component } from "react";

class MyComponent extends Component { }
```

### Example 3

Suitable for polyfilling browser built-ins (eg. `window.fetch`) 

**.babelrc**

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        { "anonymous": ["fetch"], "path": "whatwg-fetch" }
      ]
    }
  ]]
}
```

**In**

```javascript
fetch("http://example.com/qwe");
```

**Out**

```javascript
import "whatwg-fetch";

fetch("http://example.com/qwe");
```

### Example 4

Generate import path by filename. [name] will be replaced to processed filename.

**.babelrc**

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        { "default": "styles", "path": "./[name].css" }
      ]
    }
  ]]
}
```

**In**

``` component-name.js ```

```javascript
// ...
<input className={styles.className} />
// ...
```

**Out**

```javascript
import styles from "./component-name.css";
// ...
<input className={styles.className} />
// ...
```

You can process filename by "nameReplacePattern" and "nameReplaceString" options. It's processing like this:

```javascript
"basename.js".replace(new RegExp(nameReplacePattern), nameReplaceString); // == [name]
```

By default
```javascript
nameReplacePattern == "\\.js$";
nameReplaceString == "";
```


**.babelrc**

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        {
          "default": "styles", "path": "./[name].css",
          "nameReplacePattern": "\.component\.js$", "nameReplaceString": ".styles"
        }
      ]
    }
  ]]
}
```

**In**

``` name.component.js ```

```javascript
// ...
<input className={styles.className} />
// ...
```

**Out**

```javascript
import styles from "./name.styles.css";
// ...
<input className={styles.className} />
// ...
```

## Using with Create React App

If you don't want to eject your project, you can use [react-app-rewired](https://github.com/timarney/react-app-rewired) and
[customize-cra](https://github.com/arackaf/customize-cra).

[Follow the instructions](https://github.com/timarney/react-app-rewired#how-to-rewire-your-create-react-app-project).

**config-overrides.js**

```javascript
const { override, addBabelPlugins, disableEsLint } = require("customize-cra");

const autoImportPluginOptions = {
    "declarations": [
        { "default": "React", members: ["Component"], "path": "react" }
    ]
};


module.exports = override(
    ...addBabelPlugins([require("babel-plugin-auto-import"), autoImportPluginOptions]),
    disableEsLint(),
);
```
