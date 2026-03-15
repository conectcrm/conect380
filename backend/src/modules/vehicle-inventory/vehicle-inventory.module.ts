import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleInventoryController } from './vehicle-inventory.controller';
import { VehicleInventoryService } from './vehicle-inventory.service';
import { VehicleInventoryItem } from './entities/vehicle-inventory-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleInventoryItem])],
  controllers: [VehicleInventoryController],
  providers: [VehicleInventoryService],
  exports: [VehicleInventoryService],
})
export class VehicleInventoryModule {}
