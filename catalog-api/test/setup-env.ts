process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'segredo-de-teste';
process.env.THROTTLE_LIMIT ??= '100000';
process.env.THROTTLE_AUTH_LIMIT ??= '100000';
delete process.env.RABBITMQ_URL;
