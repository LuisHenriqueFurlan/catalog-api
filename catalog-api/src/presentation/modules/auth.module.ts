import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { IPasswordHasher } from '../../application/ports/password-hasher.js';
import { ITokenService } from '../../application/ports/token-service.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase.js';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.usecase.js';
import { BcryptPasswordHasher } from '../../infrastructure/auth/bcrypt-password-hasher.js';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard.js';
import { JwtTokenService } from '../../infrastructure/auth/jwt-token.service.js';
import { RolesGuard } from '../../infrastructure/auth/roles.guard.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { AuthController } from '../controllers/auth.controller.js';

@Module({
  imports: [
    PersistenceModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '1h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    { provide: IPasswordHasher, useClass: BcryptPasswordHasher },
    { provide: ITokenService, useClass: JwtTokenService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
