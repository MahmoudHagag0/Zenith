import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  candlesQuerySchema,
  searchAssetsQuerySchema,
  type CandlesQueryInput,
  type SearchAssetsQueryInput,
} from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketDataService } from './market-data.service';

@ApiTags('market-data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('search')
  search(@Query(new ZodValidationPipe(searchAssetsQuerySchema)) query: SearchAssetsQueryInput) {
    return this.marketDataService.searchAssets(query.q);
  }

  @Get('provider-health')
  getProviderHealth() {
    return this.marketDataService.checkProviderHealth();
  }

  @Get('assets/:assetId')
  getAsset(@Param('assetId') assetId: string) {
    return this.marketDataService.getAsset(assetId);
  }

  @Get('assets/:assetId/quote')
  getQuote(@Param('assetId') assetId: string) {
    return this.marketDataService.getQuote(assetId);
  }

  @Get('assets/:assetId/market-status')
  getMarketStatus(@Param('assetId') assetId: string) {
    return this.marketDataService.getMarketStatus(assetId);
  }

  @Get('assets/:assetId/candles')
  getCandles(
    @Param('assetId') assetId: string,
    @Query(new ZodValidationPipe(candlesQuerySchema)) query: CandlesQueryInput,
  ) {
    return this.marketDataService.getCandles(assetId, new Date(query.from), new Date(query.to));
  }
}
