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

        if (parentPath.isArrayExpression())
            return true;
        else
        if (parentPath.isArrowFunctionExpression())
            return true;
        else
        if (parentPath.isAssignmentExpression() && parentPath.get("right") == path)
            return true;
        else
        if (parentPath.isAwaitExpression())
            return true;
        else
        if (parentPath.isBinaryExpression())
            return true;
        else
        if (parentPath.bindExpression && parentPath.bindExpression())
            return true;
        else
        if (parentPath.isCallExpression())
            return true;
        else
        if (parentPath.isClassDeclaration() && parentPath.get("superClass") == path)
            return true;
        else
        if (parentPath.isClassExpression() && parentPath.get("superClass") == path)
            return true;
        else
        if (parentPath.isConditionalExpression())
            return true;
        else
        if (parentPath.isDecorator())
            return true;
        else
        if (parentPath.isDoWhileStatement())
            return true;
        else
        if (parentPath.isExpressionStatement())
            return true;
        else
        if (parentPath.isExportDefaultDeclaration())
            return true;
        else
        if (parentPath.isForInStatement())
            return true;
        else
        if (parentPath.isForStatement())
            return true;
        else
        if (parentPath.isIfStatement())
            return true;
        else
        if (parentPath.isLogicalExpression())
            return true;
        else
        if (parentPath.isMemberExpression() && parentPath.get("object") == path)
            return true;
        else
        if (parentPath.isNewExpression())
            return true;
        else
        if (parentPath.isObjectProperty() && parentPath.get("value") == path)
            return !parentPath.node.shorthand;
        else
        if (parentPath.isReturnStatement())
            return true;
        else
        if (parentPath.isSpreadElement())
            return true;
        else
        if (parentPath.isSwitchStatement())
            return true;
        else
        if (parentPath.isTaggedTemplateExpression())
            return true;
        else
        if (parentPath.isThrowStatement())
            return true;
        else
        if (parentPath.isUnaryExpression())
            return true;
        else
        if (parentPath.isVariableDeclarator() && parentPath.get("init") == path)
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

    function insertImport(program, identifier, type, pathToModule) {
        let programBody = program.get("body");

        let currentImportDeclarations = programBody.reduce(toImportDeclarations, []);

        let importDidAppend =
            currentImportDeclarations.some(importAlreadyExists, {identifier, pathToModule});

        if (importDidAppend)
            return;

        importDidAppend =
            currentImportDeclarations.some(addToImportDeclaration, {identifier, type, pathToModule});

        if (importDidAppend)
            return;

        let specifier;

        if (type == ImportType.DEFAULT) {
            specifier = t.importDefaultSpecifier(identifier);
        }
        else
        if (type == ImportType.MEMBER) {
            specifier = t.importSpecifier(identifier, identifier);
        }

        let importDeclaration = t.importDeclaration([specifier], t.stringLiteral(pathToModule));

        program.unshiftContainer("body", importDeclaration);
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

    function importAlreadyExists({node: importDeclaration}) {
        let {identifier, pathToModule} = this;

        if (importDeclaration.source.value == pathToModule) {
            return importDeclaration.specifiers.some(checkSpecifierLocalName, identifier);
        }
    }

    function checkSpecifierLocalName(specifier) {
        let identifier = this;

        return specifier.local.name == identifier.name;
    }

    function addToImportDeclaration(importDeclarationPath) {
        let {identifier, type, pathToModule} = this;
        let {node} = importDeclarationPath;

        if (node.source.value != pathToModule)
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
