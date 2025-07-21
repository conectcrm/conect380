"use strict";
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
exports.ClientesService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var cliente_entity_1 = require("./cliente.entity");
var ClientesService = /** @class */ (function () {
    function ClientesService(clienteRepository) {
        this.clienteRepository = clienteRepository;
    }
    ClientesService.prototype.create = function (clienteData) {
        return __awaiter(this, void 0, void 0, function () {
            var cliente;
            return __generator(this, function (_a) {
                cliente = this.clienteRepository.create(clienteData);
                return [2 /*return*/, this.clienteRepository.save(cliente)];
            });
        });
    };
    ClientesService.prototype.findAll = function (empresaId, params) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, limit, search, _c, sortBy, _d, sortOrder, queryBuilder, _e, clientes, total;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = params.page, page = _a === void 0 ? 1 : _a, _b = params.limit, limit = _b === void 0 ? 10 : _b, search = params.search, _c = params.sortBy, sortBy = _c === void 0 ? 'created_at' : _c, _d = params.sortOrder, sortOrder = _d === void 0 ? 'DESC' : _d;
                        queryBuilder = this.clienteRepository
                            .createQueryBuilder('cliente')
                            .where('cliente.empresa_id = :empresaId', { empresaId: empresaId })
                            .andWhere('cliente.ativo = :ativo', { ativo: true });
                        if (search) {
                            queryBuilder.andWhere('(cliente.nome ILIKE :search OR cliente.email ILIKE :search OR cliente.empresa ILIKE :search)', { search: "%".concat(search, "%") });
                        }
                        queryBuilder
                            .orderBy("cliente.".concat(sortBy), sortOrder)
                            .skip((page - 1) * limit)
                            .take(limit);
                        return [4 /*yield*/, queryBuilder.getManyAndCount()];
                    case 1:
                        _e = _f.sent(), clientes = _e[0], total = _e[1];
                        return [2 /*return*/, {
                                success: true,
                                data: clientes,
                                pagination: {
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    totalPages: Math.ceil(total / limit)
                                }
                            }];
                }
            });
        });
    };
    ClientesService.prototype.findById = function (id, empresaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.clienteRepository.findOne({
                        where: { id: id, empresa_id: empresaId, ativo: true }
                    })];
            });
        });
    };
    ClientesService.prototype.update = function (id, empresaId, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clienteRepository.update({ id: id, empresa_id: empresaId }, updateData)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.findById(id, empresaId)];
                }
            });
        });
    };
    ClientesService.prototype["delete"] = function (id, empresaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clienteRepository.update({ id: id, empresa_id: empresaId }, { ativo: false })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientesService.prototype.getByStatus = function (empresaId, status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.clienteRepository.find({
                        where: { empresa_id: empresaId, status: status, ativo: true },
                        order: { updated_at: 'DESC' }
                    })];
            });
        });
    };
    ClientesService.prototype.updateStatus = function (id, empresaId, status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clienteRepository.update({ id: id, empresa_id: empresaId }, { status: status, ultimo_contato: new Date() })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.findById(id, empresaId)];
                }
            });
        });
    };
    ClientesService.prototype.getClientesProximoContato = function (empresaId) {
        return __awaiter(this, void 0, void 0, function () {
            var hoje, amanha;
            return __generator(this, function (_a) {
                hoje = new Date();
                amanha = new Date(hoje);
                amanha.setDate(hoje.getDate() + 1);
                return [2 /*return*/, this.clienteRepository.find({
                        where: {
                            empresa_id: empresaId,
                            ativo: true
                        },
                        order: { proximo_contato: 'ASC' }
                    })];
            });
        });
    };
    ClientesService.prototype.getEstatisticas = function (empresaId) {
        return __awaiter(this, void 0, void 0, function () {
            var totalClientes, clientesAtivos, leads, prospects, inativos, inicioMes, novosClientesMes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clienteRepository.count({
                            where: { empresa_id: empresaId, ativo: true }
                        })];
                    case 1:
                        totalClientes = _a.sent();
                        return [4 /*yield*/, this.clienteRepository.count({
                                where: { empresa_id: empresaId, ativo: true, status: cliente_entity_1.StatusCliente.CLIENTE }
                            })];
                    case 2:
                        clientesAtivos = _a.sent();
                        return [4 /*yield*/, this.clienteRepository.count({
                                where: { empresa_id: empresaId, ativo: true, status: cliente_entity_1.StatusCliente.LEAD }
                            })];
                    case 3:
                        leads = _a.sent();
                        return [4 /*yield*/, this.clienteRepository.count({
                                where: { empresa_id: empresaId, ativo: true, status: cliente_entity_1.StatusCliente.PROSPECT }
                            })];
                    case 4:
                        prospects = _a.sent();
                        return [4 /*yield*/, this.clienteRepository.count({
                                where: { empresa_id: empresaId, ativo: true, status: cliente_entity_1.StatusCliente.INATIVO }
                            })];
                    case 5:
                        inativos = _a.sent();
                        inicioMes = new Date();
                        inicioMes.setDate(1);
                        inicioMes.setHours(0, 0, 0, 0);
                        return [4 /*yield*/, this.clienteRepository
                                .createQueryBuilder('cliente')
                                .where('cliente.empresa_id = :empresaId', { empresaId: empresaId })
                                .andWhere('cliente.ativo = :ativo', { ativo: true })
                                .andWhere('cliente.created_at >= :inicioMes', { inicioMes: inicioMes })
                                .getCount()];
                    case 6:
                        novosClientesMes = _a.sent();
                        return [2 /*return*/, {
                                totalClientes: totalClientes,
                                clientesAtivos: clientesAtivos,
                                leads: leads,
                                prospects: prospects,
                                inativos: inativos,
                                novosClientesMes: novosClientesMes
                            }];
                }
            });
        });
    };
    ClientesService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente))
    ], ClientesService);
    return ClientesService;
}());
exports.ClientesService = ClientesService;
