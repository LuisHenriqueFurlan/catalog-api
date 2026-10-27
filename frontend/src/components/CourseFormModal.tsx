import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api/endpoints';
import type { Course } from '../api/types';
import { ErrorBanner, Field, Modal } from './ui';

export function CourseFormModal({
  course,
  onClose,
  onSaved,
}: {
  course?: Course;
  onClose: () => void;
  onSaved?: (course: Course) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(course?.title ?? '');
  const [category, setCategory] = useState(course?.category ?? '');
  const [description, setDescription] = useState(course?.description ?? '');

  const save = useMutation({
    mutationFn: () => {
      const input = {
        title: title.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      };
      return course ? api.courses.update(course.id, input) : api.courses.create(input);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      onSaved?.(saved);
      onClose();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <Modal
      title={course ? 'Editar curso' : 'Novo curso'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" form="course-form" disabled={save.isPending}>
            {save.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="course-form" className="form" onSubmit={submit}>
        <Field label="Título" hint="Entre 3 e 200 caracteres">
          <input required minLength={3} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <input maxLength={100} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Backend, Dados…" />
        </Field>
        <Field label="Descrição">
          <textarea rows={4} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <ErrorBanner error={save.error} />
      </form>
    </Modal>
  );
}
