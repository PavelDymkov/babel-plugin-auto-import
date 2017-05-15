const babel = require("babel-core");
const {assert} = require("chai");


const babelOptions = {
    plugins: [["babel-plugin-auto-import", { declarations: null }]]
};
const spaces = /\s+/g;

function isEquil(input, expected, declarations) {
    babelOptions.plugins[0][1].declarations = declarations;

    let output = babel.transform(input, babelOptions).code;

    return output.replace(spaces, "") == expected.replace(spaces, "");
};


describe("Tests", () => {
    it("case 1", () => {
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

    it("case 2", () => {
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

    it("case 3", () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            members: ["someVariable"], path: "some-path/some-module.js"
        };
        let output = `
            import { someVariable } from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 4", () => {
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
            { members: ["y"], path: "some-path/y.js" }
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

    it("case 5", () => {
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

    it("case 6", () => {
        let input = `
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
        let declaration = {
            path: "some-path",
            default: "x",
            members: ["y", "z"]
        };
        let output = `
            import x, { q, y, z } from "some-path";

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

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 7", () => {
        let input = `
            x.y.z;
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x } from "some-path";

            x.y.z;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 8", () => {
        let input = `
            let a = x.b();
            let c = d.b();
        `;
        let declaration = {
            default: "x", path: "some-path"
        };
        let output = `
            import x from "some-path";
            
            let a = x.b();
            let c = d.b();
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 9", () => {
        let input = `
            x:
            for (let i = 0; i < 10; i++) {
                if (i) break x;
            
                y:
                for (let i = 0; i < 10; i++) {
                    if (i) continue y;
                }
            }
        `;
        let declaration = {
            members: ["x", "y"], path: "some-path"
        };
        let output = input;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 10", () => {
        let input = `
            try {
                class x {
                    y() {}
                }
                
                a = class z {};
            } catch (q) {}
        `;
        let declaration = {
            members: ["x", "y", "z", "q"], path: "some-path"
        };
        let output = input;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 11", () => {
        let input = `
            function x() { }
            
            let a = function y() {};
            let b = {
                c: function z() {}
            };
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = input;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 12", () => {
        let input = `
            ({ x } = a);
            
            [y] = b;
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = input;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 13", () => {
        let input = `
            export default x;
        `;
        let declaration = {
            default: "x", path: "some-path"
        };
        let output = `
            import x from "some-path";
            
            export default x;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 14", () => {
        let input = `
            ({ x } = a);
            
            [y] = b;
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = input;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 15", () => {
        let input = `
            (function () {
                let a = x;
                let b = x;
            } ());
        `;
        let declaration = {
            default: "x", path: "some-path"
        };
        let output = `
            import x from "some-path";

            (function () {
                let a = x;
                let b = x;
            })();
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 16", () => {
        let input = `
            let a = b + x;
        `;
        let declaration = {
            default: "x", path: "some-path"
        };
        let output = `
            import x from "some-path";

            let a = b + x;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 17", () => {
        let input = `
            let a = x ? y : z;
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x, y, z } from "some-path";

            let a = x ? y : z;
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });

    it("case 18", () => {
        let input = `
            let a = b => x;
            
            let c = d(y);
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
        `;

        assert.isTrue(isEquil(input, output, [declaration]));
    });
});
