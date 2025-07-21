"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.AccessibleButton = void 0;
var react_1 = require("react");
var useAccessibility_1 = require("../../hooks/useAccessibility");
var variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
};
var sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
};
exports.AccessibleButton = (0, react_1.forwardRef)(function (_a, ref) {
    var _b = _a.variant, variant = _b === void 0 ? 'primary' : _b, _c = _a.size, size = _c === void 0 ? 'md' : _c, _d = _a.loading, loading = _d === void 0 ? false : _d, _e = _a.loadingText, loadingText = _e === void 0 ? 'Carregando...' : _e, leftIcon = _a.leftIcon, rightIcon = _a.rightIcon, _f = _a.fullWidth, fullWidth = _f === void 0 ? false : _f, disabled = _a.disabled, children = _a.children, _g = _a.className, className = _g === void 0 ? '' : _g, onClick = _a.onClick, ariaLabel = _a["aria-label"], props = __rest(_a, ["variant", "size", "loading", "loadingText", "leftIcon", "rightIcon", "fullWidth", "disabled", "children", "className", "onClick", 'aria-label']);
    var announceToScreenReader = (0, useAccessibility_1.useAccessibility)({ announceChanges: true }).announceToScreenReader;
    var buttonId = react_1["default"].useId();
    var handleClick = function (event) {
        if (loading || disabled) {
            event.preventDefault();
            return;
        }
        // Anunciar ação para leitores de tela
        if (ariaLabel) {
            announceToScreenReader("Bot\u00E3o ".concat(ariaLabel, " ativado"), 'polite');
        }
        onClick === null || onClick === void 0 ? void 0 : onClick(event);
    };
    var baseClasses = "\n      accessible-button\n      inline-flex items-center justify-center\n      font-medium rounded-lg transition-all duration-200\n      focus:outline-none focus:ring-2 focus:ring-offset-2\n      disabled:opacity-50 disabled:cursor-not-allowed\n      relative overflow-hidden\n    ";
    var classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        loading ? 'cursor-wait' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<button ref={ref} id={buttonId} className={classes} disabled={disabled || loading} onClick={handleClick} aria-label={ariaLabel} aria-busy={loading} aria-describedby={loading ? "".concat(buttonId, "-loading") : undefined} role="button" {...props}>
        {/* Loading State */}
        {loading && (<>
            <span id={"".concat(buttonId, "-loading")} className="sr-only" aria-live="polite">
              {loadingText}
            </span>
            <div className="absolute inset-0 flex items-center justify-center bg-inherit" aria-hidden="true">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          </>)}

        {/* Button Content */}
        <span className={loading ? 'invisible' : 'flex items-center justify-center gap-2'}>
          {leftIcon && (<span aria-hidden="true" className="flex-shrink-0">
              {leftIcon}
            </span>)}
          <span>{children}</span>
          {rightIcon && (<span aria-hidden="true" className="flex-shrink-0">
              {rightIcon}
            </span>)}
        </span>
      </button>);
});
exports.AccessibleButton.displayName = 'AccessibleButton';
