const babel = require("@babel/core");
const { assert } = require("chai");

const babelOptions = {
    plugins: [[require("../"), { declarations: null }]],
};
const spaces = /(\s|\t|\r|\n)+/g;

function isEqual(input, expected, declarations, filename) {
    babelOptions.plugins[0][1].declarations = declarations;

    let needDeleteFilename = false;

    if (!babelOptions.filename) {
        needDeleteFilename = true;
        babelOptions.filename = filename || "default.js";
    }

    let output = babel.transform(input, babelOptions).code;

    if (needDeleteFilename) delete babelOptions.filename;
    /*the outputed code will be printed when went wrong*/
    return (output.replace(spaces, "") == expected.replace(spaces, "")) || (console.log(output),false);
}

describe("Tests", () => {
    it(`case f3004854`, () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            default: "someVariable",
            path: "some-path/some-module.js",
        };
        let output = `
            import someVariable from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 72abd8ee`, () => {
        let input = `
            import someVariable from "some-path/some-module.js";

            someVariable;
        `;
        let declaration = {
            default: "someVariable",
            path: "some-path/some-module.js",
        };
        let output = `
            import someVariable from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case eb873e18`, () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            members: ["someVariable"],
            path: "some-path/some-module.js",
        };
        let output = `
            import { someVariable } from "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 8ac619cd`, () => {
        let input = `
            toolkitNamespace.debounce;
            toolkit.debounce;
            debounce;
            toolkit();
        `;
        let declaration = {
            members: ["debounce"],
            namespace : "toolkitNamespace",
	         default : "toolkit",
            path: "@toolkit/core",
        };
        let output = `
            import toolkit, { debounce } from "@toolkit/core";
            import * as toolkitNamespace from "@toolkit/core";
            
            toolkitNamespace.debounce;
            toolkit.debounce;
            debounce;
            toolkit();
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 50c90cc6`, () => {
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
            { members: ["y"], path: "some-path/y.js" },
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

        assert.isTrue(isEqual(input, output, declarations));
    });

    it(`case 899bff85`, () => {
        let input = `
            let someVariable;
        `;
        let declaration = {
            default: "someVariable",
            path: "some-path/some-module.js",
        };
        let output = `
            let someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 5fbad1c9`, () => {
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
            members: ["y", "z"],
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

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 647cf2b1`, () => {
        let input = `
            x.y.z;
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x } from "some-path";

            x.y.z;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case b26b1bcc`, () => {
        let input = `
            let a = x.b();
            let c = d.b();
        `;
        let declaration = {
            default: "x",
            path: "some-path",
        };
        let output = `
            import x from "some-path";

            let a = x.b();
            let c = d.b();
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 31666940`, () => {
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
            members: ["x", "y"],
            path: "some-path",
        };
        let output = input;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case b6cee56d`, () => {
        let input = `
            try {
                class x {
                    y() {}
                }

                a = class z {};
            } catch (q) {}
        `;
        let declaration = {
            members: ["x", "y", "z", "q"],
            path: "some-path",
        };
        let output = input;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 122196f2`, () => {
        let input = `
            function x() { }

            let a = function y() {};
            let b = {
                c: function z() {}
            };
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = input;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 8396261c`, () => {
        let input = `
            ({ x } = a);

            [y] = b;
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = input;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 6e20dac7`, () => {
        let input = `
            export default x;
        `;
        let declaration = {
            default: "x",
            path: "some-path",
        };
        let output = `
            import x from "some-path";

            export default x;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 2079f24e`, () => {
        let input = `
            let a = {
                b: x,
                y,
                z: c
            };
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y } from "some-path";

            let a = {
                b: x,
                y,
                z: c
            };
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 0bc2d1bd`, () => {
        let input = `
            (function () {
                let a = x;
                let b = x;
            } ());
        `;
        let declaration = {
            default: "x",
            path: "some-path",
        };
        let output = `
            import x from "some-path";

            (function () {
                let a = x;
                let b = x;
            })();
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case bfd8b1ed`, () => {
        let input = `
            let a = b + x;
        `;
        let declaration = {
            default: "x",
            path: "some-path",
        };
        let output = `
            import x from "some-path";

            let a = b + x;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case e584d067`, () => {
        let input = `
            let a = x ? y : z;
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y, z } from "some-path";

            let a = x ? y : z;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 379f0b96`, () => {
        let input = `
            let a = b => x;

            let c = d(y);

            if (z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y, z } from "some-path";

            let a = b => x;

            let c = d(y);

            if (z) {}
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 6cf0cf3d`, () => {
        let input = `
            for (let a in x) {}

            for (let i = 0; y; z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y, z } from "some-path";

            for (let a in x) {}

            for (let i = 0; y; z) {}
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 9aa5a8d0`, () => {
        let input = `
            new x;
            new a.y();
            new z();
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, z } from "some-path";

            new x();
            new a.y();
            new z();
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 4f1e9272`, () => {
        let input = `
            function a() {
                return x;
            }

            y\`\`;

            switch(z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y, z } from "some-path";

            function a() {
                return x;
            }

            y\`\`;

            switch (z) {}
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 97d9847b`, () => {
        let input = `
            throw x;
            +y;
        `;
        let declaration = {
            members: ["x", "y", "z"],
            path: "some-path",
        };
        let output = `
            import { x, y } from "some-path";

            throw x;
            +y;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case b24f8825`, () => {
        let input = `
            class A extends X { }

            let B = class B extends Y { };
        `;
        let declaration = {
            members: ["X", "Y"],
            path: "some-path",
        };
        let output = `
            import { X, Y } from "some-path";

            class A extends X { }

            let B = class B extends Y { };
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case f6838ccb`, () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            anonymous: ["someVariable"],
            path: "some-path/some-module.js",
        };
        let output = `
            import "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case 796ad655`, () => {
        let input = `
            let x = a + b;
        `;
        let declaration = {
            anonymous: ["a", "b"],
            path: "some-path/some-module.js",
        };
        let output = `
            import "some-path/some-module.js";

            let x = a + b;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it(`case ce351f9a`, () => {
        let input = `
            styles.className;
        `;
        let filename = "./componentName.js";
        let declaration = {
            default: "styles",
            path: "./[name].css",
        };
        let output = `
            import styles from "./componentName.css";

            styles.className;
        `;

        assert.isTrue(isEqual(input, output, [declaration], filename));
    });

    it(`case 9a2dfe69`, () => {
        let input = `
            styles.className;
        `;
        let filename = "./name.component.js";
        let declaration = {
            default: "styles",
            path: "./[name].css",
            nameReplacePattern: ".component.js$",
            nameReplaceString: ".styles",
        };
        let output = `
            import styles from "./name.styles.css";

            styles.className;
        `;

        assert.isTrue(isEqual(input, output, [declaration], filename));
    });
});
