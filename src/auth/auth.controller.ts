import { BadRequestException, Body, Controller, ForbiddenException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ){}

    @Post('captcha')
    async captcha(@Body() body: any){
        const { recaptchaToken } = body
        
        const isValid = await this.authService.validateRecaptcha(recaptchaToken)

        return isValid
    }

    @Post('login')
    async login(@Body('userId') userId: string, @Body('password') password:string, @Body('recaptchaToken') token: string
    ){
        const isValid = await this.authService.validateRecaptcha(token)
        if(!isValid) throw new BadRequestException
        const res = await this.authService.signIn(userId, password)
        return res
    }

    @Post('signup')
    async signup(
        @Body('userId') userId: string,
        @Body('password') password: string,
        @Body('userNick') userNick: string,
        @Body('recaptchaToken') token: string,
        @Body('profileImage') profileImage: string,
    ){
        const isValid = await this.authService.validateRecaptcha(token)
        if(!isValid) throw new BadRequestException
        
        try{
            const regex = /^https:\/\/chat\.nalgae\.me\/profile\/[a-zA-Z0-9_-]*$/
            const profileImgUrl = profileImage ? profileImage : ''
            if(profileImgUrl !== "" || !regex.test(profileImgUrl)) throw new ForbiddenException("허용되지 않은 URL")
            const user = await this.authService.signUp(userId, password, userNick, profileImgUrl)
            return { message: "Success", user }
        }catch(err){
            return { message: err.message }
    }
    }
}
