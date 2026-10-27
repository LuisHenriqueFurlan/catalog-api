import { ValidationError } from '../errors.js';

export interface CourseProps {
  title: string;
  category?: string | null;
  description?: string | null;
}

export class Course {
  static readonly MIN_TITLE_LENGTH = 3;

  private constructor(
    public id: number | undefined,
    public title: string,
    public category: string | null,
    public description: string | null,
    public createdAt: Date | undefined,
  ) {}

  /** Novo curso (ainda sem id); aplica as regras de criação. */
  static create(props: CourseProps): Course {
    Course.assertValidTitle(props.title);
    return new Course(
      undefined,
      props.title.trim(),
      props.category ?? null,
      props.description ?? null,
      undefined,
    );
  }

  /** Reidrata um curso já persistido (sem revalidar). */
  static restore(data: {
    id: number;
    title: string;
    category: string | null;
    description: string | null;
    createdAt: Date;
  }): Course {
    return new Course(data.id, data.title, data.category, data.description, data.createdAt);
  }

  /** Substitui os campos editáveis (PUT). */
  update(props: CourseProps): void {
    Course.assertValidTitle(props.title);
    this.title = props.title.trim();
    this.category = props.category ?? null;
    this.description = props.description ?? null;
  }

  private static assertValidTitle(title: string): void {
    if (typeof title !== 'string' || title.trim().length < Course.MIN_TITLE_LENGTH) {
      throw new ValidationError(
        `O título deve ter ao menos ${Course.MIN_TITLE_LENGTH} caracteres`,
      );
    }
  }
}
