import { MigrationInterface, QueryRunner } from "typeorm";

export class Lessons1793115798730 implements MigrationInterface {
    name = 'Lessons1793115798730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "courseId" integer NOT NULL, "title" varchar NOT NULL, "order" integer NOT NULL, "contentUrl" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d6dd086eced65901723c1f5753f" UNIQUE ("courseId", "order"))`);
        await queryRunner.query(`CREATE TABLE "lesson_progress" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "lessonId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('not_started'), "completedAt" datetime, CONSTRAINT "UQ_2786d400e741735839c156d5aeb" UNIQUE ("studentId", "lessonId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "courseId" integer NOT NULL, "title" varchar NOT NULL, "order" integer NOT NULL, "contentUrl" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d6dd086eced65901723c1f5753f" UNIQUE ("courseId", "order"), CONSTRAINT "FK_1a9ff2409a84c76560ae8a92590" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_lessons"("id", "courseId", "title", "order", "contentUrl", "createdAt") SELECT "id", "courseId", "title", "order", "contentUrl", "createdAt" FROM "lessons"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`ALTER TABLE "temporary_lessons" RENAME TO "lessons"`);
        await queryRunner.query(`CREATE TABLE "temporary_lesson_progress" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "lessonId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('not_started'), "completedAt" datetime, CONSTRAINT "UQ_2786d400e741735839c156d5aeb" UNIQUE ("studentId", "lessonId"), CONSTRAINT "FK_4acd3150e1ad2b6db8448a89348" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_df13299d2740b302dd44a368df9" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_lesson_progress"("id", "studentId", "lessonId", "status", "completedAt") SELECT "id", "studentId", "lessonId", "status", "completedAt" FROM "lesson_progress"`);
        await queryRunner.query(`DROP TABLE "lesson_progress"`);
        await queryRunner.query(`ALTER TABLE "temporary_lesson_progress" RENAME TO "lesson_progress"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_progress" RENAME TO "temporary_lesson_progress"`);
        await queryRunner.query(`CREATE TABLE "lesson_progress" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "lessonId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('not_started'), "completedAt" datetime, CONSTRAINT "UQ_2786d400e741735839c156d5aeb" UNIQUE ("studentId", "lessonId"))`);
        await queryRunner.query(`INSERT INTO "lesson_progress"("id", "studentId", "lessonId", "status", "completedAt") SELECT "id", "studentId", "lessonId", "status", "completedAt" FROM "temporary_lesson_progress"`);
        await queryRunner.query(`DROP TABLE "temporary_lesson_progress"`);
        await queryRunner.query(`ALTER TABLE "lessons" RENAME TO "temporary_lessons"`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "courseId" integer NOT NULL, "title" varchar NOT NULL, "order" integer NOT NULL, "contentUrl" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d6dd086eced65901723c1f5753f" UNIQUE ("courseId", "order"))`);
        await queryRunner.query(`INSERT INTO "lessons"("id", "courseId", "title", "order", "contentUrl", "createdAt") SELECT "id", "courseId", "title", "order", "contentUrl", "createdAt" FROM "temporary_lessons"`);
        await queryRunner.query(`DROP TABLE "temporary_lessons"`);
        await queryRunner.query(`DROP TABLE "lesson_progress"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
    }

}
