"use strict";
exports.__esModule = true;
exports.BaseIcon = void 0;
var react_1 = require("react");
var BaseIcon = function (_a) {
    var _b = _a.size, size = _b === void 0 ? 24 : _b, _c = _a.className, className = _c === void 0 ? '' : _c, _d = _a.color, color = _d === void 0 ? 'currentColor' : _d, children = _a.children, _e = _a.viewBox, viewBox = _e === void 0 ? '0 0 24 24' : _e, ariaLabel = _a["aria-label"];
    return (<svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"inline-block ".concat(className)} role="img" aria-label={ariaLabel} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>);
};
exports.BaseIcon = BaseIcon;
