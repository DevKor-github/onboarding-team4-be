import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy} from 'passport-jwt'
import { UserService } from "src/user/user.service";
import { JwtPayload } from "./jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private readonly configService: ConfigService, private readonly userService: UserService) {
        const secret = configService.get<string>('JWT_SECRET')
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get("JWT_SECRET")
        })
    }

    async validate(payload: JwtPayload){
        const user = await this.userService.getUserObjId(payload.sub)
        if(!user) throw new UnauthorizedException()
        return user
    }
}