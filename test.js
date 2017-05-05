const babel = require("babel-core");
const declarations = [
    { default: "x", path: "some-path/x.js" },
    { imports: ["y"], path: "some-path/y.js" },
    { default: "someVariable", path: "some-path/some-module.js" }
];
const babelOptions = {
    plugins: [["auto-import", {declarations}]],
    //presets: ["es2015"]
};


let input;
input = `
    import z from "some-path/y.js";

    let a;

    (function () {
        let b;
        
        (function () {
            let c = a;
            let d = x();
            let e = a;
            let f = y;
            let g;
        })();
    })();
`;
input = `
    someVariable
`;


console.log( babel.transform(input, babelOptions).code );