import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';

type AuthedRequest = IncomingMessage & {
  id?: string;
  originalUrl?: string;
  route?: { path?: string };
  user?: { userId: number; role: string };
};

const SILENT_PATHS = ['/health', '/metrics'];

export function loggerParams(config: ConfigService): Params {
  return {
    pinoHttp: {
      level: config.get<string>('LOG_LEVEL', 'info'),
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length <= 100 ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      customProps: (req: IncomingMessage) => {
        const { user, route } = req as AuthedRequest;
        return { endpoint: route?.path, userId: user?.userId, role: user?.role };
      },
      customLogLevel: (_req, res, error) =>
        error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      autoLogging: {
        ignore: (req: IncomingMessage) => SILENT_PATHS.includes((req.url ?? '').split('?')[0]),
      },
      serializers: {
        req: (req: AuthedRequest) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
      },
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  };
}
