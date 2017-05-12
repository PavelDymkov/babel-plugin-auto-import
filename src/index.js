const isArray = require("is-array");


const ImportType = {
    DEFAULT: 1,
    MEMBER: 2
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

                let {declarations} = options;

                for (let key in declarations) if (declarations.hasOwnProperty(key)) {
                    let declaration = declarations[key];

                    if (hasDefault(identifier, declaration)) {
                        insertImport(path, identifier, ImportType.DEFAULT, declaration.path);
                    }
                    else
                    if (hasMember(identifier, declaration)) {
                        insertImport(path, identifier, ImportType.MEMBER, declaration.path);
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

    function hasDefault(identifier, declaration) {
        return declaration["default"] == identifier.name;
    }

    function hasMember(identifier, declaration) {
        let members = isArray(declaration.members) ? declaration.members : [];

        return members.some(has, identifier);
    }

    function insertImport(path, identifier, type, moduleSource) {
        let program = path.findParent(isProgram);
        let programBody = program.get("body");

        let currentImportDeclarations = programBody.reduce(toImportDeclaration, []);

        let importDidAppend =
            currentImportDeclarations.some(addToImportDeclaration, {identifier, type, moduleSource});

        if (!importDidAppend) {
            let specifier;

            if (type == ImportType.DEFAULT) {
                specifier = t.importDefaultSpecifier(identifier);
            }

            if (type == ImportType.MEMBER) {
                specifier = t.importSpecifier(identifier, identifier);
            }

            let importDeclaration = t.importDeclaration([specifier], t.stringLiteral(moduleSource));

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

    function addToImportDeclaration(importDeclarationPath) {
        let {identifier, type, moduleSource} = this;
        let {node} = importDeclarationPath;

        if (node.source.value != moduleSource)
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

        if (type == ImportType.MEMBER) {
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
