import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

const WEAK_SECRETS = ['troque-por-um-segredo-longo-e-aleatorio', 'changeme', 'secret'];

export class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET deve ter ao menos 16 caracteres' })
  JWT_SECRET: string;

  @IsOptional()
  @Matches(/^\d+[smhd]?$/, { message: 'JWT_EXPIRES_IN inválido (ex.: 15m, 1h, 7d)' })
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @Matches(/^mongodb(\+srv)?:\/\//, { message: 'MONGO_URL deve começar com mongodb://' })
  MONGO_URL?: string;

  @IsOptional()
  @Matches(/^amqps?:\/\//, { message: 'RABBITMQ_URL deve começar com amqp://' })
  RABBITMQ_URL?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  THROTTLE_LIMIT?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  THROTTLE_AUTH_LIMIT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const parsed = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(parsed);
  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${details}`);
  }
  if (config.NODE_ENV === 'production' && WEAK_SECRETS.includes(String(config.JWT_SECRET))) {
    throw new Error('JWT_SECRET de exemplo não pode ser usado em produção');
  }
  return config;
}
