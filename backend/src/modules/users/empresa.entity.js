"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Empresa = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../users/user.entity");
var Empresa = /** @class */ (function () {
    function Empresa() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    ], Empresa.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)({ length: 100 })
    ], Empresa.prototype, "nome");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, unique: true })
    ], Empresa.prototype, "slug");
    __decorate([
        (0, typeorm_1.Column)({ length: 20, unique: true })
    ], Empresa.prototype, "cnpj");
    __decorate([
        (0, typeorm_1.Column)({ length: 100 })
    ], Empresa.prototype, "email");
    __decorate([
        (0, typeorm_1.Column)({ length: 20, nullable: true })
    ], Empresa.prototype, "telefone");
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], Empresa.prototype, "endereco");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, nullable: true })
    ], Empresa.prototype, "cidade");
    __decorate([
        (0, typeorm_1.Column)({ length: 2, nullable: true })
    ], Empresa.prototype, "estado");
    __decorate([
        (0, typeorm_1.Column)({ length: 10, nullable: true })
    ], Empresa.prototype, "cep");
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], Empresa.prototype, "logo_url");
    __decorate([
        (0, typeorm_1.Column)({ type: 'json', nullable: true })
    ], Empresa.prototype, "configuracoes");
    __decorate([
        (0, typeorm_1.Column)({ "default": true })
    ], Empresa.prototype, "ativo");
    __decorate([
        (0, typeorm_1.CreateDateColumn)()
    ], Empresa.prototype, "created_at");
    __decorate([
        (0, typeorm_1.UpdateDateColumn)()
    ], Empresa.prototype, "updated_at");
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return user_entity_1.User; }, function (user) { return user.empresa; })
    ], Empresa.prototype, "usuarios");
    Empresa = __decorate([
        (0, typeorm_1.Entity)('empresas')
    ], Empresa);
    return Empresa;
}());
exports.Empresa = Empresa;
