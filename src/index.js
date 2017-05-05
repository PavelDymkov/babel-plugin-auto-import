const ImportType = {
    DEFAULT: 1,
    IMPORT: 2
};


export default function({types: t}) {
    return {
        visitor: {
            Identifier(path, {opts: options}) {
                debugger
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
            }
        }
    };


    function isCorrectIdentifier({parentPath}) {
        return !parentPath.isDeclaration() && !parentPath.findParent(isImportDeclaration);
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
        let program = path.findParent(isProgram);
        let programBody = program.get("body");

        let currentImportDeclarations = programBody.reduce(toImportDeclaration, []);

        let importDidAppend = false;

        if (currentImportDeclarations.length != 0) {
            importDidAppend =
                currentImportDeclarations.some(addToCurrentImportDeclarations, {identifier, type, source});
        }

        if (!importDidAppend) {
            let specifier;

            if (type == ImportType.DEFAULT) {
                specifier = t.importDefaultSpecifier(identifier);
            }

            if (type == ImportType.IMPORT) {
                specifier = t.importSpecifier(identifier, identifier);
            }

            let importDeclaration = t.importDeclaration([specifier], t.stringLiteral(source));

            program.unshiftContainer("body", importDeclaration);
        }
    }

    function isProgram(path) {
        return path.isProgram();
    }

    function isImportDeclaration(path) {
        return path.isImportDeclaration();
    }

    function toImportDeclaration(list, currentPath) {
        if (currentPath.isImportDeclaration())
            list.push(currentPath);

        return list;
    }

    function addToCurrentImportDeclarations(importDeclarationPath) {
        let {identifier, type, source} = this;
        let {node} = importDeclarationPath;

        if (node.source.value != source)
            return false;

        let {specifiers} = node;

        if (type == ImportType.DEFAULT) {
            if (!specifiers.some(hasImportDefaultSpecifier)) {
                let specifier = t.importDefaultSpecifier(identifier);

                specifiers.unshift(specifier);

                importDeclarationPath.replaceWith(node);

                return true;
            }
        }

        if (type == ImportType.IMPORT) {
            if (!specifiers.some(hasSpecifierWithName, identifier)) {
                let specifier = t.importSpecifier(identifier, identifier);

                specifiers.push(specifier);

                importDeclarationPath.replaceWith(node);

                return true;
            }
        }

        return false;
    }

    function hasImportDefaultSpecifier(path) {
        return path.isImportDefaultSpecifier();
    }

    function hasSpecifierWithName(node) {
        if (!t.isImportSpecifier(node))
            return false;

        let {name} = this;

        return node.imported.name == name;
    }
}
