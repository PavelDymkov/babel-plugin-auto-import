const { basename } = require("path");
const not = require("logical-not");

const ImportTypeEnum = ({
    /*support:import * as namespace*/
    NAMESPACE : Symbol("NAMESPACE") ,
    DEFAULT : Symbol("DEFAULT") ,
    MEMBER : Symbol("MEMBER") ,
    ANONYMOUS : Symbol("ANONYMOUS"),
});

module.exports = function ({ types : t }) {
    return {
        visitor : {
            Identifier(path, { opts: options, file }) {
                if ( not(path.isReferencedIdentifier()) ) return;
                
                let { node: identifier, scope } = path;
                
                if ( isDefined(identifier , scope) ) return;
                
                let { declarations } = options;
                
                if ( not(Array.isArray(declarations)) ) return;
                
                let filename = file.opts.filename ? basename(file.opts.filename) : "";
                
                declarations.forEach(handleDeclaration , {
                    path ,
                    identifier ,
                    filename ,
                });
            } ,
        } ,
    };
    
    function isDefined(identifier, { bindings, parent }) {
        let variables = Object.keys(bindings);
        
        if ( variables.some(has , identifier) ) return true;
        
        return parent ? isDefined(identifier , parent) : false;
    }
    
    function has (identifier) {
        let { name } = this;
        
        return identifier == name;
    }
    
    function handleDeclaration (declaration) {
        let { path, identifier, filename } = this;
        
        if ( not(declaration) ) return;
        
        const program = path.findParent((path) => path.isProgram());
        const pathToModule = getPathToModule(declaration , filename);
        
        let types = [];
        if ( hasDefault(declaration , identifier) ) {
            types.push(ImportTypeEnum.DEFAULT);
        } 
        
        if ( hasMember(declaration , identifier) ) {
            types.push(ImportTypeEnum.MEMBER);
        } 
        
        if ( hasAnonymous(declaration , identifier) ) {
            types.push(ImportTypeEnum.ANONYMOUS);
        }
        
        /**
         * support:
         * import * as somethingModule from 'something';
         * import something from 'something';
         */
        if ( hasNamespace(declaration , identifier) ) {
            types.push(ImportTypeEnum.NAMESPACE);
        }
        insertImport(program , identifier , types , pathToModule);
    }
    
    function hasDefault (declaration , identifier) {
        return declaration["default"] == identifier.name;
    }
    
    function hasNamespace (declaration , identifier) {
        return declaration["namespace"] == identifier.name;
    }
    
    function hasMember (declaration , identifier) {
        let members = Array.isArray(declaration.members) ? declaration.members : [];
        
        return members.some(has , identifier);
    }
    
    function hasAnonymous (declaration , identifier) {
        let anonymous = Array.isArray(declaration.anonymous) ? declaration.anonymous : [];
        
        return anonymous.some(has , identifier);
    }
    
    function generateSpecifiers (identifier , types) {
        
        return types.reduce((accum,type) => {
            switch ( type ) {
                case ImportTypeEnum.DEFAULT : {
                    accum.push(t.importDefaultSpecifier(identifier));
                    break;
                }
                case ImportTypeEnum.NAMESPACE : {
                    /*skip it , will add an another import statement for namespace*/
                    break;
                }
                case ImportTypeEnum.ANONYMOUS : {
                    break;
                }
                case ImportTypeEnum.MEMBER : {
                    accum.push(t.importSpecifier(identifier , identifier));
                    break;
                }
            }
            return accum;
        },[]);
    }
    
    function insertImport (program , identifier , types , pathToModule) {
        let programBody = program.get("body");
        
        let currentImportDeclarations = programBody.reduce(toImportDeclarations , []);
        
        
        types.forEach((type) => {
            let importDidAppend;
            importDidAppend = currentImportDeclarations.some(importAlreadyExists , {
                identifier ,
                type ,
                pathToModule ,
            });
            if ( importDidAppend ) return;
            importDidAppend = currentImportDeclarations.some(addToImportDeclaration , {
                identifier ,
                type ,
                pathToModule ,
            });
            if ( importDidAppend ) return;
            
            
            if(types.includes(ImportTypeEnum.NAMESPACE)){
                program.unshiftContainer("body" , t.importDeclaration([t.importNamespaceSpecifier(identifier)],t.stringLiteral(pathToModule)));
            }
            
            const specifiers = generateSpecifiers(identifier , types);
            
            let importDeclaration = t.importDeclaration(specifiers , t.stringLiteral(pathToModule));
            
            program.unshiftContainer("body" , importDeclaration);
            
        });
    }
    
    
    function toImportDeclarations (list , currentPath) {
        if ( currentPath.isImportDeclaration() ) list.push(currentPath);
        
        return list;
    }
    
    function importAlreadyExists ({ node : importDeclaration }) {
        let { identifier, type, pathToModule } = this;
        
        if ( importDeclaration.source.value == pathToModule ) {
            if ( type == ImportTypeEnum.ANONYMOUS ) return true;
            
            return importDeclaration.specifiers.some(checkSpecifierLocalName , identifier);
        }
    }
    
    function checkSpecifierLocalName (specifier) {
        let identifier = this;
        
        return specifier.local.name == identifier.name;
    }
    
    function addToImportDeclaration (importDeclarationPath) {
        let { identifier, type, pathToModule } = this;
        let { node } = importDeclarationPath;
        
        if ( node.source.value != pathToModule ) return false;
        
        let { specifiers } = node;
        
        if ( type == ImportTypeEnum.DEFAULT ) {
            if ( not(specifiers.some(hasImportDefaultSpecifier)) ) {
                let specifier = t.importDefaultSpecifier(identifier);
                
                importDeclarationPath.unshiftContainer("specifiers" , specifier);
                
                return true;
            }
        }
        
        if ( type == ImportTypeEnum.MEMBER ) {
            if ( not(specifiers.some(hasSpecifierWithName , identifier)) ) {
                let specifier = t.importSpecifier(identifier , identifier);
                
                importDeclarationPath.pushContainer("specifiers" , specifier);
                
                return true;
            }
        }
    }
    
    function hasImportDefaultSpecifier (node) {
        return t.isImportDefaultSpecifier(node);
    }
    
    function hasSpecifierWithName (node) {
        if ( not(t.isImportSpecifier(node)) ) return false;
        
        let { name } = this;
        
        return node.imported.name == name;
    }
    
    function getPathToModule (declaration , filename) {
        if ( declaration.path.includes("[name]") ) {
            let pattern = declaration.nameReplacePattern || "\\.js$";
            let newSubString = declaration.nameReplaceString || "";
            
            let name = filename.replace(new RegExp(pattern) , newSubString);
            
            return declaration.path.replace("[name]" , name);
        }
        
        return declaration.path;
    }
}
