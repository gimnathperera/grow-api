import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Kid, KidSchema } from "./schemas/kid.schema";
import { KidsController } from "./kids.controller";
import { KidsService } from "./kids.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Kid.name, schema: KidSchema }]),
    UsersModule,
  ],
  controllers: [KidsController],
  providers: [KidsService],
  exports: [KidsService],
})
export class KidsModule {}
