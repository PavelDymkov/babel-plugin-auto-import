const babel = require("babel-core");
const declarations = [
    {
        path: "some-path",
        default: "x",
        members: ["y", "z"]
    }
];
const babelOptions = {
    plugins: [["auto-import", {declarations}]],
    //presets: ["es2015"]
};


let input;
input = `
    import { q } from "some-path";

    let a;

    (function () {
        let b;
        
        (function () {
            let c = a;
            let d = x();
            let e = a;
            let f = y;
            let g = z;
        })();
    })();
`;


console.log( babel.transform(input, babelOptions).code );