import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Kid, KidSchema } from "./schemas/kid.schema";
import { User, UserSchema } from "@/users/schemas/user.schema";
import { KidsController } from "./kids.controller";
import { KidsService } from "./kids.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kid.name, schema: KidSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [KidsController],
  providers: [KidsService],
})
export class KidsModule {}
