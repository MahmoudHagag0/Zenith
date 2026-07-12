import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ExchangesController],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
