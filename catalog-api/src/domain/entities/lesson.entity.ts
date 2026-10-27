import { ValidationError } from '../errors.js';

export interface LessonProps {
  courseId: number;
  title: string;
  order: number;
  contentUrl: string;
}

export class Lesson {
  private constructor(
    public id: number | undefined,
    public readonly courseId: number,
    public title: string,
    public order: number,
    public contentUrl: string,
    public createdAt: Date | undefined,
  ) {}

  static create(props: LessonProps): Lesson {
    if (typeof props.title !== 'string' || props.title.trim().length < 3) {
      throw new ValidationError('O título da aula deve ter ao menos 3 caracteres');
    }
    if (!Number.isInteger(props.order) || props.order < 1) {
      throw new ValidationError('A ordem da aula deve ser um inteiro maior que zero');
    }
    return new Lesson(
      undefined,
      props.courseId,
      props.title.trim(),
      props.order,
      props.contentUrl,
      undefined,
    );
  }

  static restore(data: LessonProps & { id: number; createdAt: Date }): Lesson {
    return new Lesson(
      data.id,
      data.courseId,
      data.title,
      data.order,
      data.contentUrl,
      data.createdAt,
    );
  }
}
