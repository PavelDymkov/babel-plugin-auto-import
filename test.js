const babel = require("babel-core");
const babelOptions = {
    plugins: [["auto-import"]],
    //presets: ["es2015"]
};


let input = `
    (function () {
        let x = test();
      
        return x + y;
    })();
`;


console.log( babel.transform(input, babelOptions).code );