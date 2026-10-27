import { Course } from './entities/course.entity.js';
import { Student } from './entities/student.entity.js';
import { ValidationError } from './errors.js';
import { Email } from './value-objects/email.vo.js';

describe('Course', () => {
  it('rejeita título com menos de 3 caracteres', () => {
    expect(() => Course.create({ title: 'ab' })).toThrow(ValidationError);
    expect(() => Course.create({ title: '  a ' })).toThrow(ValidationError);
  });

  it('cria curso válido e aplica trim; opcionais viram null', () => {
    const course = Course.create({ title: '  NestJS  ' });
    expect(course.title).toBe('NestJS');
    expect(course.category).toBeNull();
  });

  it('update também valida o título', () => {
    const course = Course.create({ title: 'NestJS' });
    expect(() => course.update({ title: 'x' })).toThrow(ValidationError);
  });
});

describe('Email', () => {
  it('normaliza e valida', () => {
    expect(Email.create('  Ana@Example.COM ').value).toBe('ana@example.com');
    expect(() => Email.create('invalido')).toThrow(ValidationError);
  });
});

describe('Student', () => {
  it('serializa o e-mail como string', () => {
    const student = Student.create({ name: 'Ana', email: 'ana@example.com' });
    expect(JSON.parse(JSON.stringify(student)).email).toBe('ana@example.com');
  });
});
