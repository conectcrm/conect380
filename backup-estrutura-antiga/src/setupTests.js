"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
require("@testing-library/jest-dom");
// Mock para window.matchMedia (usado em responsive hooks)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }); })
});
// Mock para IntersectionObserver
global.IntersectionObserver = /** @class */ (function () {
    function IntersectionObserver() {
    }
    IntersectionObserver.prototype.observe = function () {
        return null;
    };
    IntersectionObserver.prototype.disconnect = function () {
        return null;
    };
    IntersectionObserver.prototype.unobserve = function () {
        return null;
    };
    return IntersectionObserver;
}());
// Mock para ResizeObserver
global.ResizeObserver = /** @class */ (function () {
    function ResizeObserver() {
    }
    ResizeObserver.prototype.observe = function () {
        return null;
    };
    ResizeObserver.prototype.disconnect = function () {
        return null;
    };
    ResizeObserver.prototype.unobserve = function () {
        return null;
    };
    return ResizeObserver;
}());
// Mock para console.error para testes mais limpos
var originalError = console.error;
beforeAll(function () {
    console.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is deprecated')) {
            return;
        }
        originalError.call.apply(originalError, __spreadArray([console], args, false));
    };
});
afterAll(function () {
    console.error = originalError;
});
