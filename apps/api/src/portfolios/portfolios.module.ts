import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
