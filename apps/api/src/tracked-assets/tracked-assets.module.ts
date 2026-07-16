import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TrackedAssetsService } from './tracked-assets.service';

@Module({
  imports: [DatabaseModule],
  providers: [TrackedAssetsService],
  exports: [TrackedAssetsService],
})
export class TrackedAssetsModule {}
