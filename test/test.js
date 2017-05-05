const babel = require("babel-core");
const {assert} = require("chai");


const babelOptions = {
    plugins: [["babel-plugin-auto-import", { declarations: null }]]
};
const spaces = /\s+/g;

function isEquil(input, expected, declarations) {
    babelOptions.plugins[0][1].declarations = declarations;

    let output = babel.transform(input, babelOptions).code;

    if (output.replace(spaces, "") != expected.replace(spaces, "")) {
        console.log(output)
    }

    return output.replace(spaces, "") == expected.replace(spaces, "");
};


describe("Tests", () => {
    it("should import default", () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            default: "someVariable", path: "some-path/some-module.js"
        };
        let output = `
            import someVariable from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("should not import default", () => {
        let input = `
            import someVariable from "some-path/some-module.js";
            
            someVariable;
        `;
        let declaration = {
            default: "someVariable", path: "some-path/some-module.js"
        };
        let output = `
            import someVariable from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("should add import", () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            imports: ["someVariable"], path: "some-path/some-module.js"
        };
        let output = `
            import {someVariable} from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("should import x and y", () => {
        let input = `
            import z from "some-path/y.js";

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
        let declarations = [
            { default: "x", path: "some-path/x.js" },
            { imports: ["y"], path: "some-path/y.js" }
        ];
        let output = `
            import x from "some-path/x.js";
            import z, { y } from "some-path/y.js";

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

        assert.isTrue(isEquil(input, output, declarations));
    });

    it("should not add import", () => {
        let input = `
            let someVariable;
        `;
        let declaration = {
            default: "someVariable", path: "some-path/some-module.js"
        };
        let output = `
            let someVariable;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });
});
