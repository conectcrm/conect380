"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.User = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
var empresa_entity_1 = require("./empresa.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["VENDEDOR"] = "vendedor";
    UserRole["USER"] = "user";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var User = /** @class */ (function () {
    function User() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    ], User.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)({ length: 100 })
    ], User.prototype, "nome");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, unique: true })
    ], User.prototype, "email");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "senha");
    __decorate([
        (0, typeorm_1.Column)({ length: 20, nullable: true })
    ], User.prototype, "telefone");
    __decorate([
        (0, typeorm_1.Column)({ type: 'enum', "enum": UserRole, "default": UserRole.USER })
    ], User.prototype, "role");
    __decorate([
        (0, typeorm_1.Column)({ type: 'simple-array', nullable: true })
    ], User.prototype, "permissoes");
    __decorate([
        (0, typeorm_1.Column)('uuid')
    ], User.prototype, "empresa_id");
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], User.prototype, "avatar_url");
    __decorate([
        (0, typeorm_1.Column)({ length: 10, "default": 'pt-BR' })
    ], User.prototype, "idioma_preferido");
    __decorate([
        (0, typeorm_1.Column)({ type: 'json', nullable: true })
    ], User.prototype, "configuracoes");
    __decorate([
        (0, typeorm_1.Column)({ "default": true })
    ], User.prototype, "ativo");
    __decorate([
        (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    ], User.prototype, "ultimo_login");
    __decorate([
        (0, typeorm_1.CreateDateColumn)()
    ], User.prototype, "created_at");
    __decorate([
        (0, typeorm_1.UpdateDateColumn)()
    ], User.prototype, "updated_at");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return empresa_entity_1.Empresa; }, function (empresa) { return empresa.usuarios; }),
        (0, typeorm_1.JoinColumn)({ name: 'empresa_id' })
    ], User.prototype, "empresa");
    User = __decorate([
        (0, typeorm_1.Entity)('users')
    ], User);
    return User;
}());
exports.User = User;
