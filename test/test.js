const babel = require("@babel/core");
const {assert} = require("chai");


const babelOptions = {
    plugins: [[require('../').default, { declarations: null }]]
};
const spaces = /\s+/g;

function isEqual(input, expected, declarations, filename) {
    babelOptions.plugins[0][1].declarations = declarations;

    let needDeleteFilename = false;
    if (!babelOptions.filename) {
        needDeleteFilename = true;
        babelOptions.filename = filename || 'default.js';
    }

    let output = babel.transform(input, babelOptions).code;

    if (needDeleteFilename) delete babelOptions.filename;

    return output.replace(spaces, "") == expected.replace(spaces, "");
}


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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, declarations));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 14", () => {
        let input = `
            let a = {
                b: x,
                y,
                z: c
            };
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x } from "some-path";

            let a = {
                b: x,
                y,
                z: c
            };
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
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

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 18", () => {
        let input = `
            let a = b => x;

            let c = d(y);

            if (z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x, y, z } from "some-path";

            let a = b => x;

            let c = d(y);

            if (z) {}
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 19", () => {
        let input = `
            for (let a in x) {}

            for (let i = 0; y; z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x, y, z } from "some-path";

            for (let a in x) {}

            for (let i = 0; y; z) {}
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 20", () => {
        let input = `
            new x;
            new a.y();
            new z();
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x, z } from "some-path";

            new x();
            new a.y();
            new z();
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 21", () => {
        let input = `
            function a() {
                return x;
            }

            y\`\`;

            switch(z) {}
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
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

    it("case 22", () => {
        let input = `
            throw x;
            +y;
        `;
        let declaration = {
            members: ["x", "y", "z"], path: "some-path"
        };
        let output = `
            import { x, y } from "some-path";

            throw x;
            +y;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 23", () => {
        let input = `
            class A extends X { }

            let B = class B extends Y { };
        `;
        let declaration = {
            members: ["X", "Y"], path: "some-path"
        };
        let output = `
            import { X, Y } from "some-path";

            class A extends X { }

            let B = class B extends Y { };
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 24", () => {
        let input = `
            someVariable;
        `;
        let declaration = {
            anonymous: ["someVariable"], path: "some-path/some-module.js"
        };
        let output = `
            import "some-path/some-module.js";

            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it("case 25", () => {
        let input = `
            let x = a + b;
        `;
        let declaration = {
            anonymous: ["a", "b"], path: "some-path/some-module.js"
        };
        let output = `
            import "some-path/some-module.js";

            let x = a + b;
        `;

        assert.isTrue(isEqual(input, output, [declaration]));
    });

    it ("case 26", () => {
        let input = `
            styles.className;
        `;
        let filename = "./componentName.js";
        let declaration = {
            default: "styles", path: "./[name].css"
        };
        let output = `
            import styles from "./componentName.css";

            styles.className;
        `;

        assert.isTrue(isEqual(input, output, [declaration], filename));
    });

    it ("case 27", () => {
        let input = `
            styles.className;
        `;
        let filename = "./name.component.js";
        let declaration = {
            default: "styles", path: "./[name].css",
            nameReplacePattern: "\.component\.js$", nameReplaceString: ".styles"
        };
        let output = `
            import styles from "./name.styles.css";

            styles.className;
        `;

        assert.isTrue(isEqual(input, output, [declaration], filename));
    });

    it("case 28 - ignore node_modules", () => {
        let input = `
            someVariable;
        `;
        let filename = 'node_modules/default.js';
        let declaration = {
            default: "someVariable", path: "some-path/some-module.js"
        };
        let output = `
            someVariable;
        `;

        assert.isTrue(isEqual(input, output, [declaration], filename));
    });
});
