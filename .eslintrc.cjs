/** @type (import('eslint').Linter.ConfigType) */
module.exports = {
    root: true,
    env: {browser: true, es2020: true},
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'eslint-plugin-react-compiler', 'eslint-plugin-unused-imports'],
    settings: {
        react: {
            version: "19",
        },
    },
    rules: {
        'react-compiler/react-compiler': 'error',
        'react-refresh/only-export-components': [
            'warn',
            {allowConstantExport: true},
        ],
        'require-await': 'warn',
        'prefer-const': [
            'warn',
            {destructuring: 'all'},
        ],
        '@typescript-eslint/ban-ts-comment': [
            'warn',
            {'ts-expect-error': 'allow-with-description'},
        ],
        "@typescript-eslint/consistent-type-imports": "error",
        '@typescript-eslint/no-inferrable-types': [
            'warn',
            {ignoreParameters: true, ignoreProperties: true}
        ],
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-control-regex': 'off',
        'prefer-rest-params': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-interface': [
            'warn',
            {'allowSingleExtends': true},
        ],
        '@typescript-eslint/no-unused-vars': "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
            "warn",
            {
                "ignoreRestSiblings": true,
                "vars": "all",
                "caughtErrors": "all",
                "args": "after-used",
                "varsIgnorePattern": "^__",
                "argsIgnorePattern": "^__",
                "reportUsedIgnorePattern": true,
            },
        ],
        'no-constant-condition': [
            'error',
            {checkLoops: false},
        ],
        '@typescript-eslint/no-empty-object-type': [
            'warn',
            {allowObjectTypes: 'always'},
        ]
    },
}
