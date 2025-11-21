import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventosTable1691234567890 implements MigrationInterface {
  name = 'CreateEventosTable1691234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            CREATE TABLE eventos (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start TIMESTAMP NOT NULL,
                "end" TIMESTAMP NOT NULL,
                "allDay" BOOLEAN DEFAULT false,
                location VARCHAR(100),
                type VARCHAR(20) DEFAULT 'meeting' CHECK (type IN ('meeting', 'call', 'task', 'follow-up', 'presentation')),
                priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
                status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
                category VARCHAR(100),
                color VARCHAR(7) DEFAULT '#3B82F6',
                attendees TEXT,
                notes VARCHAR(500),
                "isRecurring" BOOLEAN DEFAULT false,
                "recurringPattern" JSONB,
                "responsavelId" UUID NOT NULL,
                "criadoPorId" UUID NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_eventos_responsavel FOREIGN KEY ("responsavelId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT fk_eventos_criado_por FOREIGN KEY ("criadoPorId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
            );
            
            CREATE INDEX idx_eventos_responsavel ON eventos("responsavelId");
            CREATE INDEX idx_eventos_criado_por ON eventos("criadoPorId");
            CREATE INDEX idx_eventos_start_date ON eventos(start);
            CREATE INDEX idx_eventos_status ON eventos(status);
            CREATE INDEX idx_eventos_type ON eventos(type);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS eventos CASCADE;`);
  }
}
