# babel-plugin-auto-import


Convert global variables to import statements


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
