import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

// App components
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// Core modules
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CoachesModule } from "./coaches/coaches.module";
import { ClientsModule } from "./clients/clients.module";
import { SessionsModule } from "./sessions/sessions.module";
import { PassesModule } from "./passes/passes.module";
import { MilestonesModule } from "./milestones/milestones.module";
import { CrmModule } from "./crm/crm.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReportsModule } from "./reports/reports.module";
import { ContentModule } from "./content/content.module";
import { QuizModule } from "./quiz/quiz.module";
import { EstoreModule } from "./estore/estore.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { CalendarModule } from "./calendar/calendar.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import { AuditsModule } from "./audits/audits.module";
import { FilesModule } from "./files/files.module";
import { TeamModule } from "./team/team.module";
import { KidsModule } from "./kids/kids.module";

// Common modules
import { CommonModule } from "./common/common.module";

// Guards
import { ThrottlerGuard } from "@nestjs/throttler";

@Module({
  controllers: [AppController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    MongooseModule.forRoot(
      process.env.MONGO_URI || "mongodb://localhost:27017/grow-fitness"
    ),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60") * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || "100"),
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    CoachesModule,
    ClientsModule,
    SessionsModule,
    PassesModule,
    MilestonesModule,
    CrmModule,
    InvoicesModule,
    PaymentsModule,
    ReportsModule,
    ContentModule,
    QuizModule,
    EstoreModule,
    FeedbackModule,
    CalendarModule,
    NotificationsModule,
    AdminModule,
    AuditsModule,
    FilesModule,
    TeamModule,
    KidsModule,

    // Common utilities
    CommonModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
