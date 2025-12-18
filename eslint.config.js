import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "warn",
      
      // ================================
      // SECURITY RULES - Prevent Injection Attacks
      // ================================
      
      // Prevent code injection via eval()
      "no-eval": "error",
      
      // Prevent indirect eval() calls (setTimeout/setInterval with strings)
      "no-implied-eval": "error",
      
      // Prevent new Function() which is equivalent to eval
      "no-new-func": "error",
      
      // Prevent script URL protocols (javascript:)
      "no-script-url": "error",
      
      // Prevent void operator (can be used maliciously)
      "no-void": "warn",
      
      // Prevent with statements (security and performance issues)
      "no-with": "error",
      
      // Require strict equality (=== instead of ==)
      "eqeqeq": ["error", "always"],
      
      // Prevent reassigning native objects
      "no-native-reassign": "error",
      
      // Prevent extending native prototypes
      "no-extend-native": "error",
      
      // Prevent __proto__ usage
      "no-proto": "error",
      
      // Prevent calling Object.prototype methods directly on objects
      "no-prototype-builtins": "warn",
    },
  },
);
