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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var user_decorator_1 = require("../../common/decorators/user.decorator");
var UsersController = /** @class */ (function () {
    function UsersController(usersService) {
        this.usersService = usersService;
    }
    UsersController.prototype.getProfile = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        success: true,
                        data: {
                            id: user.id,
                            nome: user.nome,
                            email: user.email,
                            telefone: user.telefone,
                            role: user.role,
                            avatar_url: user.avatar_url,
                            idioma_preferido: user.idioma_preferido,
                            empresa: {
                                id: user.empresa.id,
                                nome: user.empresa.nome,
                                slug: user.empresa.slug
                            }
                        }
                    }];
            });
        });
    };
    UsersController.prototype.updateProfile = function (user, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersService.update(user.id, updateData)];
                    case 1:
                        updatedUser = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: updatedUser,
                                message: 'Perfil atualizado com sucesso'
                            }];
                }
            });
        });
    };
    UsersController.prototype.getTeam = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var team;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.usersService.findByEmpresa(user.empresa_id)];
                    case 1:
                        team = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: team.map(function (member) { return ({
                                    id: member.id,
                                    nome: member.nome,
                                    email: member.email,
                                    role: member.role,
                                    avatar_url: member.avatar_url,
                                    ativo: member.ativo,
                                    ultimo_login: member.ultimo_login
                                }); })
                            }];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Get)('profile'),
        (0, swagger_1.ApiOperation)({ summary: 'Obter perfil do usuário logado' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil retornado com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)())
    ], UsersController.prototype, "getProfile");
    __decorate([
        (0, common_1.Put)('profile'),
        (0, swagger_1.ApiOperation)({ summary: 'Atualizar perfil do usuário logado' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil atualizado com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Body)())
    ], UsersController.prototype, "updateProfile");
    __decorate([
        (0, common_1.Get)('team'),
        (0, swagger_1.ApiOperation)({ summary: 'Listar usuários da empresa' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de usuários retornada com sucesso' }),
        __param(0, (0, user_decorator_1.CurrentUser)())
    ], UsersController.prototype, "getTeam");
    UsersController = __decorate([
        (0, swagger_1.ApiTags)('users'),
        (0, swagger_1.ApiBearerAuth)(),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        (0, common_1.Controller)('users')
    ], UsersController);
    return UsersController;
}());
exports.UsersController = UsersController;
