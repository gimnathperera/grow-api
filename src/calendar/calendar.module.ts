import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { SessionsModule } from "../sessions/sessions.module";

@Module({
  imports: [SessionsModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
