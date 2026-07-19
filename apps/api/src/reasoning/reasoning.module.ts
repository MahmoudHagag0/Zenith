import { Logger, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MorningBriefModule } from '../morning-brief/morning-brief.module';
import { ReasoningController } from './reasoning.controller';
import { ReasoningService } from './reasoning.service';
import { ReasoningContextService } from './reasoning-context.service';
import { ReasoningPromptBuilderService } from './reasoning-prompt-builder.service';
import { ReasoningValidatorService } from './reasoning-validator.service';
import { ReasoningFormatterService } from './reasoning-formatter.service';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { createLLMProvider } from './llm/llm-provider.factory';

const moduleLogger = new Logger('ReasoningModule');

/**
 * The Generative AI Reasoning Layer (Blueprint Step 8, implementation
 * architecture delivered and approved this Sprint). Reuses
 * `WorkspaceService` (single-instrument context), `PortfoliosService`/
 * `AnalyticsService` (portfolio-scope context), and `MorningBriefService`
 * (tracked-assets-scope context) exactly as built -- no Confluence,
 * Journal, Alerts, Calendar/News, or COT logic is duplicated here; it all
 * flows through those already-tested services.
 *
 * `LLM_PROVIDER` is bound to `GeminiProvider` (Architecture Team's
 * development-phase provider selection) behind the provider-agnostic
 * `LLMProvider` interface -- nothing in this module, or any consumer of
 * `ReasoningService`, imports `@google/genai` directly.
 */
@Module({
  imports: [AuthModule, WorkspaceModule, PortfoliosModule, AnalyticsModule, MorningBriefModule],
  controllers: [ReasoningController],
  providers: [
    ReasoningService,
    ReasoningContextService,
    ReasoningPromptBuilderService,
    ReasoningValidatorService,
    ReasoningFormatterService,
    {
      provide: LLM_PROVIDER,
      useFactory: () => createLLMProvider(process.env.LLM_PROVIDER_MODE, process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL, moduleLogger),
    },
  ],
})
export class ReasoningModule {}
