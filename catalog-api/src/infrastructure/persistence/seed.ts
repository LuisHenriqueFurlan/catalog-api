import dataSource from './data-source.js';
import { CourseOrmEntity, StudentOrmEntity } from './typeorm/entities/index.js';

await dataSource.initialize();

const courses = dataSource.getRepository(CourseOrmEntity);
const students = dataSource.getRepository(StudentOrmEntity);

if ((await courses.count()) === 0) {
  await courses.save([
    { title: 'Node.js do zero', category: 'Backend', description: 'Fundamentos de Node.js' },
    { title: 'NestJS na prática', category: 'Backend', description: 'APIs com NestJS' },
    { title: 'SQL essencial', category: 'Banco de dados', description: null },
  ]);
}

if ((await students.count()) === 0) {
  await students.save([
    { name: 'Ana Souza', email: 'ana@example.com' },
    { name: 'Bruno Lima', email: 'bruno@example.com' },
  ]);
}

console.log(
  `Seed ok: ${await courses.count()} cursos, ${await students.count()} estudantes`,
);
await dataSource.destroy();
