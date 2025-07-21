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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ClientesController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var user_decorator_1 = require("../../common/decorators/user.decorator");
var ClientesController = /** @class */ (function () {
    function ClientesController(clientesService) {
        this.clientesService = clientesService;
    }
    ClientesController.prototype.findAll = function (user, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.clientesService.findAll(user.empresa_id, params)];
            });
        });
    };
    ClientesController.prototype.getByStatus = function (user, status) {
        return __awaiter(this, void 0, void 0, function () {
            var clientes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.getByStatus(user.empresa_id, status)];
                    case 1:
                        clientes = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: clientes
                            }];
                }
            });
        });
    };
    ClientesController.prototype.getProximoContato = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var clientes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.getClientesProximoContato(user.empresa_id)];
                    case 1:
                        clientes = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: clientes
                            }];
                }
            });
        });
    };
    ClientesController.prototype.getEstatisticas = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var estatisticas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.getEstatisticas(user.empresa_id)];
                    case 1:
                        estatisticas = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: estatisticas
                            }];
                }
            });
        });
    };
    ClientesController.prototype.findById = function (user, id) {
        return __awaiter(this, void 0, void 0, function () {
            var cliente;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.findById(id, user.empresa_id)];
                    case 1:
                        cliente = _a.sent();
                        if (!cliente) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Cliente não encontrado'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                data: cliente
                            }];
                }
            });
        });
    };
    ClientesController.prototype.create = function (user, clienteData) {
        return __awaiter(this, void 0, void 0, function () {
            var cliente;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.create(__assign(__assign({}, clienteData), { empresa_id: user.empresa_id, responsavel_id: user.id }))];
                    case 1:
                        cliente = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: cliente,
                                message: 'Cliente criado com sucesso'
                            }];
                }
            });
        });
    };
    ClientesController.prototype.update = function (user, id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var cliente;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.update(id, user.empresa_id, updateData)];
                    case 1:
                        cliente = _a.sent();
                        if (!cliente) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Cliente não encontrado'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                data: cliente,
                                message: 'Cliente atualizado com sucesso'
                            }];
                }
            });
        });
    };
    ClientesController.prototype.updateStatus = function (user, id, status) {
        return __awaiter(this, void 0, void 0, function () {
            var cliente;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService.updateStatus(id, user.empresa_id, status)];
                    case 1:
                        cliente = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: cliente,
                                message: 'Status atualizado com sucesso'
                            }];
                }
            });
        });
    };
    ClientesController.prototype["delete"] = function (user, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientesService["delete"](id, user.empresa_id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                message: 'Cliente excluído com sucesso'
                            }];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Get)(),
        (0, swagger_1.ApiOperation)({ summary: 'Listar clientes' }),
        (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
        (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
        (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
        (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, type: String }),
        (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, "enum": ['ASC', 'DESC'] }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de clientes retornada com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Query)())
    ], ClientesController.prototype, "findAll");
    __decorate([
        (0, common_1.Get)('status/:status'),
        (0, swagger_1.ApiOperation)({ summary: 'Listar clientes por status' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Clientes por status retornados com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Param)('status'))
    ], ClientesController.prototype, "getByStatus");
    __decorate([
        (0, common_1.Get)('proximo-contato'),
        (0, swagger_1.ApiOperation)({ summary: 'Clientes com próximo contato agendado' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de clientes com contatos agendados' }),
        __param(0, (0, user_decorator_1.CurrentUser)())
    ], ClientesController.prototype, "getProximoContato");
    __decorate([
        (0, common_1.Get)('estatisticas'),
        (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas dos clientes' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas retornadas com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)())
    ], ClientesController.prototype, "getEstatisticas");
    __decorate([
        (0, common_1.Get)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Obter cliente por ID' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente retornado com sucesso' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Param)('id'))
    ], ClientesController.prototype, "findById");
    __decorate([
        (0, common_1.Post)(),
        (0, swagger_1.ApiOperation)({ summary: 'Criar novo cliente' }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente criado com sucesso' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Body)())
    ], ClientesController.prototype, "create");
    __decorate([
        (0, common_1.Put)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Atualizar cliente' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente atualizado com sucesso' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Param)('id')),
        __param(2, (0, common_1.Body)())
    ], ClientesController.prototype, "update");
    __decorate([
        (0, common_1.Put)(':id/status'),
        (0, swagger_1.ApiOperation)({ summary: 'Atualizar status do cliente' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Status atualizado com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Param)('id')),
        __param(2, (0, common_1.Body)('status'))
    ], ClientesController.prototype, "updateStatus");
    __decorate([
        (0, common_1.Delete)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Excluir cliente' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente excluído com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Param)('id'))
    ], ClientesController.prototype, "delete");
    ClientesController = __decorate([
        (0, swagger_1.ApiTags)('clientes'),
        (0, swagger_1.ApiBearerAuth)(),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        (0, common_1.Controller)('clientes')
    ], ClientesController);
    return ClientesController;
}());
exports.ClientesController = ClientesController;
