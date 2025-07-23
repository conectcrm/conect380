"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.DatabaseConfig = void 0;
var common_1 = require("@nestjs/common");
var user_entity_1 = require("../modules/users/user.entity");
var empresa_entity_1 = require("../empresas/entities/empresa.entity");
var cliente_entity_1 = require("../modules/clientes/cliente.entity");
var DatabaseConfig = /** @class */ (function () {
    function DatabaseConfig(configService) {
        this.configService = configService;
    }
    DatabaseConfig.prototype.createTypeOrmOptions = function () {
        return {
            type: 'postgres',
            host: 'localhost',
            port: 5433,
            username: 'fenixcrm',
            password: 'fenixcrm123',
            database: 'fenixcrm_db',
            entities: [user_entity_1.User, empresa_entity_1.Empresa, cliente_entity_1.Cliente],
            synchronize: this.configService.get('APP_ENV') === 'development',
            logging: this.configService.get('APP_ENV') === 'development',
            ssl: this.configService.get('APP_ENV') === 'production' ? {
                rejectUnauthorized: false
            } : false
        };
    };
    DatabaseConfig = __decorate([
        (0, common_1.Injectable)()
    ], DatabaseConfig);
    return DatabaseConfig;
}());
exports.DatabaseConfig = DatabaseConfig;
