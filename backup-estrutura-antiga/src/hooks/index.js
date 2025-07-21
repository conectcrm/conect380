"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.useLiveRegion = exports.useKeyboardNavigation = exports.useAccessibility = exports.useKPIData = exports.useBreakpoint = void 0;
// Exporta todos os hooks personalizados
var useBreakpoint_1 = require("./useBreakpoint");
__createBinding(exports, useBreakpoint_1, "useBreakpoint");
var useKPIData_1 = require("./useKPIData");
__createBinding(exports, useKPIData_1, "useKPIData");
var useAccessibility_1 = require("./useAccessibility");
__createBinding(exports, useAccessibility_1, "useAccessibility");
__createBinding(exports, useAccessibility_1, "useKeyboardNavigation");
__createBinding(exports, useAccessibility_1, "useLiveRegion");
