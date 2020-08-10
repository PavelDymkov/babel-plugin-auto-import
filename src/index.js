const { basename } = require("path");
const not = require("logical-not");

const ImportType = ({
    DEFAULT,
    MEMBER,
    ANONYMOUS,
});

export default function ({ types: t }) {
    return {
        visitor: {
            Identifier(path, { opts: options, file }) {
                if (not(path.isReferencedIdentifier())) return;

                let { node: identifier, scope } = path;

                if (isDefined(identifier, scope)) return;

                let { declarations } = options;

                if (not(Array.isArray(declarations))) return;

                let filename = file.opts.filename
                    ? basename(file.opts.filename)
                    : "";

                declarations.some(handleDeclaration, {
                    path,
                    identifier,
                    filename,
                });
            },
        },
    };

    function isDefined(identifier, { bindings, parent }) {
        let variables = Object.keys(bindings);

        if (variables.some(has, identifier)) return true;

        return parent ? isDefined(identifier, parent) : false;
    }

    function has(identifier) {
        let { name } = this;

        return identifier == name;
    }

    function handleDeclaration(declaration) {
        let { path, identifier, filename } = this;

        if (not(declaration)) return;

        let importType = null;

        if (hasDefault(declaration, identifier)) {
            importType = ImportType.DEFAULT;
        } else if (hasMember(declaration, identifier)) {
            importType = ImportType.MEMBER;
        } else if (hasAnonymous(declaration, identifier)) {
            importType = ImportType.ANONYMOUS;
        }

        if (importType) {
            let program = path.findParent(isProgram);
            let pathToModule = getPathToModule(declaration, filename);

            insertImport(program, identifier, importType, pathToModule);

            return true;
        }
    }

    function hasDefault(declaration, identifier) {
        return declaration["default"] == identifier.name;
    }

    function hasMember(declaration, identifier) {
        let members = Array.isArray(declaration.members)
            ? declaration.members
            : [];

        return members.some(has, identifier);
    }

    function hasAnonymous(declaration, identifier) {
        let anonymous = Array.isArray(declaration.anonymous)
            ? declaration.anonymous
            : [];

        return anonymous.some(has, identifier);
    }

    function insertImport(program, identifier, type, pathToModule) {
        let programBody = program.get("body");

        let currentImportDeclarations = programBody.reduce(
            toImportDeclarations,
            []
        );

        let importDidAppend;

        importDidAppend = currentImportDeclarations.some(importAlreadyExists, {
            identifier,
            type,
            pathToModule,
        });

        if (importDidAppend) return;

        importDidAppend = currentImportDeclarations.some(
            addToImportDeclaration,
            { identifier, type, pathToModule }
        );

        if (importDidAppend) return;

        let specifiers = [];

        if (type == ImportType.DEFAULT) {
            specifiers.push(t.importDefaultSpecifier(identifier));
        } else if (type == ImportType.MEMBER) {
            specifiers.push(t.importSpecifier(identifier, identifier));
        } else if (type == ImportType.ANONYMOUS) {
        }

        let importDeclaration = t.importDeclaration(
            specifiers,
            t.stringLiteral(pathToModule)
        );

        program.unshiftContainer("body", importDeclaration);
    }

    function isProgram(path) {
        return path.isProgram();
    }

    function toImportDeclarations(list, currentPath) {
        if (currentPath.isImportDeclaration()) list.push(currentPath);

        return list;
    }

    function importAlreadyExists({ node: importDeclaration }) {
        let { identifier, type, pathToModule } = this;

        if (importDeclaration.source.value == pathToModule) {
            if (type == ImportType.ANONYMOUS) return true;

            return importDeclaration.specifiers.some(
                checkSpecifierLocalName,
                identifier
            );
        }
    }

    function checkSpecifierLocalName(specifier) {
        let identifier = this;

        return specifier.local.name == identifier.name;
    }

    function addToImportDeclaration(importDeclarationPath) {
        let { identifier, type, pathToModule } = this;
        let { node } = importDeclarationPath;

        if (node.source.value != pathToModule) return false;

        let { specifiers } = node;

        if (type == ImportType.DEFAULT) {
            if (not(specifiers.some(hasImportDefaultSpecifier))) {
                let specifier = t.importDefaultSpecifier(identifier);

                importDeclarationPath.unshiftContainer("specifiers", specifier);

                return true;
            }
        }

        if (type == ImportType.MEMBER) {
            if (not(specifiers.some(hasSpecifierWithName, identifier))) {
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
        if (not(t.isImportSpecifier(node))) return false;

        let { name } = this;

        return node.imported.name == name;
    }

    function getPathToModule(declaration, filename) {
        if (declaration.path.includes("[name]")) {
            let pattern = declaration.nameReplacePattern || "\\.js$";
            let newSubString = declaration.nameReplaceString || "";

            let name = filename.replace(new RegExp(pattern), newSubString);

            return declaration.path.replace("[name]", name);
        }

        return declaration.path;
    }
}
