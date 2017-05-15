const babel = require("babel-core");
const declarations = [
    { default: "x", path: "some-path" },
    { members: ["y", "z"], path: "some-path" }
];
const babelOptions = {
    plugins: [["auto-import", {declarations}]],
    //presets: ["es2015"]
};


let input;
input = `
    let a = b + x;
`;


console.log( babel.transform(input, babelOptions).code );

/*
* assignmentPattern
* exportDefaultSpecifier, exportNamespaceSpecifier, exportSpecifier
* objectPattern
* */