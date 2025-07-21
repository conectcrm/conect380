"use strict";
exports.__esModule = true;
exports.api = void 0;
var axios_1 = require("axios");
var API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
// Instância do axios
exports.api = axios_1["default"].create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});
// Interceptor para adicionar token de autenticação
exports.api.interceptors.request.use(function (config) {
    var token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});
// Interceptor para lidar com respostas de erro
exports.api.interceptors.response.use(function (response) { return response; }, function (error) {
    var _a;
    if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
        // Token expirado ou inválido
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
exports["default"] = exports.api;
