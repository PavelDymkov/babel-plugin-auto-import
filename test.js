const babel = require("babel-core");
const declarations = [
    { members: ["x", "y", "z"], path: "some-path" }
];
const babelOptions = {
    plugins: [["auto-import", {declarations}]],
    //presets: ["es2015"]
};


let input;
input = `
    if (z) a
`;


console.log( babel.transform(input, babelOptions).code );

/*
* assignmentPattern
* exportDefaultSpecifier, exportNamespaceSpecifier, exportSpecifier
* objectPattern
* */