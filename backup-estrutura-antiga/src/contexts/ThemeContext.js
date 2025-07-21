"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.useTheme = exports.ThemeProvider = void 0;
var react_1 = require("react");
var defaultTheme = {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#22c55e'
};
var ThemeContext = (0, react_1.createContext)({});
var ThemeProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(defaultTheme), theme = _b[0], setTheme = _b[1];
    var _c = (0, react_1.useState)(false), isDark = _c[0], setIsDark = _c[1];
    var toggleTheme = function () {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };
    var updateTheme = function (newTheme) {
        setTheme(function (prev) { return (__assign(__assign({}, prev), newTheme)); });
    };
    var value = {
        theme: theme,
        isDark: isDark,
        toggleTheme: toggleTheme,
        updateTheme: updateTheme
    };
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
exports.ThemeProvider = ThemeProvider;
var useTheme = function () {
    var context = (0, react_1.useContext)(ThemeContext);
    if (!context) {
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }
    return context;
};
exports.useTheme = useTheme;
