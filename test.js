const babel = require("babel-core");
const declarations = [
    { default: "React", members: ["Component"], path: "react"},
    { members: ["x", "y", "z"], path: "some-path" }
];
const babelOptions = {
    plugins: [["auto-import", {declarations}]],
    //presets: ["es2015"]
};


let input;
input = `
    class MyComponent extends Component { }
`;


console.log( babel.transform(input, babelOptions).code );

/*
* assignmentPattern
* exportDefaultSpecifier, exportNamespaceSpecifier, exportSpecifier
* objectPattern
* */