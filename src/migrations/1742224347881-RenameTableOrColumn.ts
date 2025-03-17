import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameTableOrColumn1742224347881 implements MigrationInterface {
    name = 'RenameTableOrColumn1742224347881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follows" RENAME COLUMN "folowingId" TO "followingId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follows" RENAME COLUMN "followingId" TO "folowingId"`);
    }

}
