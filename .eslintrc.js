module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 8
    },
    "rules": {
        "indent": [ "error", 2, { "MemberExpression": "off" } ],
        "linebreak-style": [ "error", "unix" ],
        "quotes": [ "error", "single" ],
        "semi": [ "error", "always" ],
        "complexity": [ "warn", 5 ]
    }
};