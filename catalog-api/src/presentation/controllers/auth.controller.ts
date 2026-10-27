import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase.js';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.usecase.js';
import { Public } from '../../infrastructure/auth/decorators.js';
import { LoginDto } from '../dtos/login.dto.js';
import { RegisterDto } from '../dtos/register.dto.js';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cria usuário (role STUDENT) e seu perfil de estudante' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.registerUser.execute(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica e devolve um JWT' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    const { accessToken } = await this.loginUser.execute(dto);
    return { accessToken, tokenType: 'Bearer' };
  }
}
