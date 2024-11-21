export const commonRules = {
    // Error Prevention
    "no-console": "error",
    "no-debugger": 2,
    "no-dupe-keys": 2,
    "no-duplicate-case": 2,
    "no-empty": 2,
    "no-extra-boolean-cast": 2,
    "valid-typeof": 2,

    // Code Quality
    "curly": 2,
    "eqeqeq": [ 2, "smart" ],
    "no-alert": 1,
    "no-unused-vars": 2,
    "no-use-before-define": 2,

    // Styling
    "array-bracket-spacing": [ 2, "always" ],
    "brace-style": [ 2, "1tbs", { "allowSingleLine": false } ],
    "comma-spacing": [ 2, { "before": false, "after": true } ],
    "indent": [ 2, 2, { "SwitchCase": 1 } ],
    "no-trailing-spaces": [ 2, { "skipBlankLines": true } ],
    "object-curly-spacing": [ 2, "always" ],
    "quotes": [ 2, "double", "avoid-escape" ],
    "semi": [ 2, "always" ],

    // ES6+ features
    "arrow-parens": [ 2, "always" ],
    "prefer-template": 1,
    "no-var": 2,
}