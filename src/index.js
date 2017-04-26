const ImportType = {
    DEFAULT: 1,
    IMPORT: 2
};


export default function({types: t}) {
    return {
        visitor: {
            Identifier(path, {opts: options}) {
                if (!isCorrectIdentifier(path))
                    return;

                let {node: identifier, scope} = path;

                if (isDefined(identifier, scope))
                    return;

                let {name: identifierName} = identifier;
                let {declarations} = options;

                for (let key in declarations) if (declarations.hasOwnProperty(key)) {
                    let declaration = declarations[key];

                    if ("default" in declaration && declaration["default"] == identifierName) {
                        insertImport(path, identifier, ImportType.DEFAULT, declaration.path);
                    }
                    else
                    if ((declaration["imports"] || []).some(has, identifier)) {
                        insertImport(path, identifier, ImportType.IMPORT, declaration.path);
                    }
                }
                debugger
            }
        }
    };


    function isCorrectIdentifier({parentPath}) {
        return parentPath.isExpression();
    }

    function isDefined(identifier, {bindings, parent}) {
        let variables = Object.keys(bindings);

        if (variables.some(has, identifier))
            return true;

        return parent ? isDefined(identifier, parent) : false;
    }

    function has(identifier) {
        let {name} = this;

        return identifier == name;
    }

    function insertImport(path, identifier, type, source) {
        let specifier;

        if (type == ImportType.DEFAULT) {
            specifier = t.importDefaultSpecifier(identifier);
        }

        if (type == ImportType.IMPORT) {
            specifier = t.importSpecifier(identifier, identifier);
        }

        let importDeclaration = t.importDeclaration([specifier], t.stringLiteral(source));

        let programPath = path.findParent(isProgram);
        let [firstProgramPath] = programPath.get("body");

        firstProgramPath.insertBefore(importDeclaration);
    }

    function isProgram(path) {
        return path.isProgram();
    }
}
