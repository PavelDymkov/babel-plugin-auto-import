export default function({types: t}) {
    return {
        visitor: {
            Identifier(path, {opts: options}) {
                if (!isCorrectIdentifier(path))
                    return;

                debugger
            }
        }
    };

    function isCorrectIdentifier({parentPath}) {
        return parentPath.isExpression();
    }
}
