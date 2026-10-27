import { MigrationInterface, QueryRunner } from "typeorm";

export class Indexes1793116094294 implements MigrationInterface {
    name = 'Indexes1793116094294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_60dd0ae4e21002e63a5fdefeec" ON "enrollments" ("courseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a01a7f0e38c6f16024d16058ab" ON "courses" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_1ac2924c6479e5fa4fc5d1eec9" ON "courses" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_df13299d2740b302dd44a368df" ON "lesson_progress" ("lessonId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_df13299d2740b302dd44a368df"`);
        await queryRunner.query(`DROP INDEX "IDX_1ac2924c6479e5fa4fc5d1eec9"`);
        await queryRunner.query(`DROP INDEX "IDX_a01a7f0e38c6f16024d16058ab"`);
        await queryRunner.query(`DROP INDEX "IDX_60dd0ae4e21002e63a5fdefeec"`);
    }

}
