import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1793114300628 implements MigrationInterface {
    name = 'Init1793114300628'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "students" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_25985d58c714a4a427ced57507b" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "courseId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_1566a16b6323a3e3ade31a02c9b" UNIQUE ("studentId", "courseId"))`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "category" varchar, "description" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_enrollments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "courseId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_1566a16b6323a3e3ade31a02c9b" UNIQUE ("studentId", "courseId"), CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_60dd0ae4e21002e63a5fdefeec8" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_enrollments"("id", "studentId", "courseId", "createdAt") SELECT "id", "studentId", "courseId", "createdAt" FROM "enrollments"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`ALTER TABLE "temporary_enrollments" RENAME TO "enrollments"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enrollments" RENAME TO "temporary_enrollments"`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "studentId" integer NOT NULL, "courseId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_1566a16b6323a3e3ade31a02c9b" UNIQUE ("studentId", "courseId"))`);
        await queryRunner.query(`INSERT INTO "enrollments"("id", "studentId", "courseId", "createdAt") SELECT "id", "studentId", "courseId", "createdAt" FROM "temporary_enrollments"`);
        await queryRunner.query(`DROP TABLE "temporary_enrollments"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TABLE "students"`);
    }

}
