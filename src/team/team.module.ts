import { Module } from "@nestjs/common";
import { TeamController } from "./team.controller";
import { ClientsModule } from "../clients/clients.module";

@Module({
  imports: [ClientsModule],
  controllers: [TeamController],
})
export class TeamModule {}
