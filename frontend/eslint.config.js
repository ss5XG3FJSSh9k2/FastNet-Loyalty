export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        React: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        Blob: "readonly",
        URL: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
];
