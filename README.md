# babel-plugin-auto-import


Convert global variables to import statements


## Example

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

```json
{
  "plugins": [[
    "auto-import", {
      "declarations": [
        { "default": "React", members: ["Component"], "path": "react" }
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