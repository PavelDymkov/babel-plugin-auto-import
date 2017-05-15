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

                if (!isArray(declarations))
                    return;

                declarations.some(handleDeclaration, { path, identifier });
            }
        }
    };


    function isCorrectIdentifier(path) {
        let {parentPath} = path;

        if (parentPath.isExpressionStatement())
            return true;

        if (parentPath.isMemberExpression() && parentPath.get("object") == path)
            return true;

        if (parentPath.isAssignmentExpression() && parentPath.get("right") == path)
            return true;

        if (parentPath.isVariableDeclarator() && parentPath.get("init") == path)
            return true;

        if (parentPath.isCallExpression())
            return true;

        if (parentPath.isExportDefaultDeclaration())
            return true;

        return false;
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

    function handleDeclaration(declaration) {
        let { path, identifier } = this;

        if (!declaration)
            return;

        let importType = null;

        if (hasDefault(declaration, identifier)) {
            importType = ImportType.DEFAULT;
        }
        else
        if (hasMember(declaration, identifier)) {
            importType = ImportType.MEMBER;
        }

        if (importType) {
            let program = path.findParent(isProgram);

            insertImport(program, identifier, importType, declaration.path);

            return true;
        }
    }

    function hasDefault(declaration, identifier) {
        return declaration["default"] == identifier.name;
    }

    function hasMember(declaration, identifier) {
        let members = isArray(declaration.members) ? declaration.members : [];

        return members.some(has, identifier);
    }

    function insertImport(program, identifier, type, moduleSource) {
        let programBody = program.get("body");

        let currentImportDeclarations = programBody.reduce(toImportDeclarations, []);

        let importDidAppend =
            currentImportDeclarations.some(addToImportDeclaration, {identifier, type, moduleSource});

        if (!importDidAppend) {
            let specifier;

            if (type == ImportType.DEFAULT) {
                specifier = t.importDefaultSpecifier(identifier);
            }
            else
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

    function toImportDeclarations(list, currentPath) {
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

                importDeclarationPath.unshiftContainer("specifiers", specifier);

                return true;
            }
        }

        if (type == ImportType.MEMBER) {
            if (!specifiers.some(hasSpecifierWithName, identifier)) {
                let specifier = t.importSpecifier(identifier, identifier);

                importDeclarationPath.pushContainer("specifiers", specifier);

                return true;
            }
        }
    }

    function hasImportDefaultSpecifier(node) {
        return t.isImportDefaultSpecifier(node);
    }

    function hasSpecifierWithName(node) {
        if (!t.isImportSpecifier(node))
            return false;

        let {name} = this;

        return node.imported.name == name;
    }
}
