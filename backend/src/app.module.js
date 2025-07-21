"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var typeorm_1 = require("@nestjs/typeorm");
var auth_module_1 = require("./modules/auth/auth.module");
var users_module_1 = require("./modules/users/users.module");
var clientes_module_1 = require("./modules/clientes/clientes.module");
var propostas_module_1 = require("./modules/propostas/propostas.module");
var produtos_module_1 = require("./modules/produtos/produtos.module");
var contratos_module_1 = require("./modules/contratos/contratos.module");
var financeiro_module_1 = require("./modules/financeiro/financeiro.module");
var dashboard_module_1 = require("./modules/dashboard/dashboard.module");
var database_config_1 = require("./config/database.config");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env'
                }),
                typeorm_1.TypeOrmModule.forRootAsync({
                    useClass: database_config_1.DatabaseConfig
                }),
                auth_module_1.AuthModule,
                users_module_1.UsersModule,
                clientes_module_1.ClientesModule,
                propostas_module_1.PropostasModule,
                produtos_module_1.ProdutosModule,
                contratos_module_1.ContratosModule,
                financeiro_module_1.FinanceiroModule,
                dashboard_module_1.DashboardModule,
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
