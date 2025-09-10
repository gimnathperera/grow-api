import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { Session, SessionSchema } from "./schemas/session.schema";
import {
  CalendarAccount,
  CalendarAccountSchema,
} from "./schemas/calendar-account.schema";
import {
  CalendarEvent,
  CalendarEventSchema,
} from "./schemas/calendar-event.schema";
import { ClientsModule } from "../clients/clients.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: CalendarAccount.name, schema: CalendarAccountSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
    ClientsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
