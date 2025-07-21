"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Cliente = exports.TipoCliente = exports.StatusCliente = void 0;
var typeorm_1 = require("typeorm");
var empresa_entity_1 = require("../users/empresa.entity");
var StatusCliente;
(function (StatusCliente) {
    StatusCliente["LEAD"] = "lead";
    StatusCliente["PROSPECT"] = "prospect";
    StatusCliente["CLIENTE"] = "cliente";
    StatusCliente["INATIVO"] = "inativo";
})(StatusCliente = exports.StatusCliente || (exports.StatusCliente = {}));
var TipoCliente;
(function (TipoCliente) {
    TipoCliente["PESSOA_FISICA"] = "pessoa_fisica";
    TipoCliente["PESSOA_JURIDICA"] = "pessoa_juridica";
})(TipoCliente = exports.TipoCliente || (exports.TipoCliente = {}));
var Cliente = /** @class */ (function () {
    function Cliente() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
    ], Cliente.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)({ length: 100 })
    ], Cliente.prototype, "nome");
    __decorate([
        (0, typeorm_1.Column)({ length: 100 })
    ], Cliente.prototype, "email");
    __decorate([
        (0, typeorm_1.Column)({ length: 20, nullable: true })
    ], Cliente.prototype, "telefone");
    __decorate([
        (0, typeorm_1.Column)({ type: 'enum', "enum": TipoCliente })
    ], Cliente.prototype, "tipo");
    __decorate([
        (0, typeorm_1.Column)({ length: 20, nullable: true })
    ], Cliente.prototype, "documento");
    __decorate([
        (0, typeorm_1.Column)({ type: 'enum', "enum": StatusCliente, "default": StatusCliente.LEAD })
    ], Cliente.prototype, "status");
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], Cliente.prototype, "endereco");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, nullable: true })
    ], Cliente.prototype, "cidade");
    __decorate([
        (0, typeorm_1.Column)({ length: 2, nullable: true })
    ], Cliente.prototype, "estado");
    __decorate([
        (0, typeorm_1.Column)({ length: 10, nullable: true })
    ], Cliente.prototype, "cep");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, nullable: true })
    ], Cliente.prototype, "empresa");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, nullable: true })
    ], Cliente.prototype, "cargo");
    __decorate([
        (0, typeorm_1.Column)({ length: 100, nullable: true })
    ], Cliente.prototype, "origem");
    __decorate([
        (0, typeorm_1.Column)({ type: 'simple-array', nullable: true })
    ], Cliente.prototype, "tags");
    __decorate([
        (0, typeorm_1.Column)({ type: 'text', nullable: true })
    ], Cliente.prototype, "observacoes");
    __decorate([
        (0, typeorm_1.Column)('uuid')
    ], Cliente.prototype, "empresa_id");
    __decorate([
        (0, typeorm_1.Column)('uuid', { nullable: true })
    ], Cliente.prototype, "responsavel_id");
    __decorate([
        (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, "default": 0 })
    ], Cliente.prototype, "valor_estimado");
    __decorate([
        (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    ], Cliente.prototype, "ultimo_contato");
    __decorate([
        (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
    ], Cliente.prototype, "proximo_contato");
    __decorate([
        (0, typeorm_1.Column)({ "default": true })
    ], Cliente.prototype, "ativo");
    __decorate([
        (0, typeorm_1.CreateDateColumn)()
    ], Cliente.prototype, "created_at");
    __decorate([
        (0, typeorm_1.UpdateDateColumn)()
    ], Cliente.prototype, "updated_at");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return empresa_entity_1.Empresa; }),
        (0, typeorm_1.JoinColumn)({ name: 'empresa_id' })
    ], Cliente.prototype, "empresaRel");
    Cliente = __decorate([
        (0, typeorm_1.Entity)('clientes')
    ], Cliente);
    return Cliente;
}());
exports.Cliente = Cliente;
