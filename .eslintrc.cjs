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
    plugins: ['react-refresh'],
    rules: {
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
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/no-this-alias': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-control-regex': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-interface': [
            'warn',
            {'allowSingleExtends': true},
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {'ignoreRestSiblings': true, args: 'none'},
        ],
        'no-constant-condition': [
            'error',
            {checkLoops: false},
        ],
    },
}
