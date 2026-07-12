import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { MarketsModule } from './markets/markets.module';
import { AssetsModule } from './assets/assets.module';
import { WatchlistsModule } from './watchlists/watchlists.module';
import { FavouritesModule } from './favourites/favourites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        redact: ['req.headers.authorization'],
      },
    }),
    HealthModule,
    AuthModule,
    ExchangesModule,
    MarketsModule,
    AssetsModule,
    WatchlistsModule,
    FavouritesModule,
  ],
})
export class AppModule {}
