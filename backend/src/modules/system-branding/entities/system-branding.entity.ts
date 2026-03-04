import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_branding')
export class SystemBranding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chave', type: 'varchar', length: 50, unique: true, default: 'global' })
  chave: string;

  @Column({ name: 'logo_full_url', type: 'text', nullable: true })
  logoFullUrl: string | null;

  @Column({ name: 'logo_full_light_url', type: 'text', nullable: true })
  logoFullLightUrl: string | null;

  @Column({ name: 'logo_icon_url', type: 'text', nullable: true })
  logoIconUrl: string | null;

  @Column({ name: 'loading_logo_url', type: 'text', nullable: true })
  loadingLogoUrl: string | null;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl: string | null;

  @Column({ name: 'maintenance_enabled', type: 'boolean', default: false })
  maintenanceEnabled: boolean;

  @Column({ name: 'maintenance_title', type: 'varchar', length: 120, nullable: true })
  maintenanceTitle: string | null;

  @Column({ name: 'maintenance_message', type: 'text', nullable: true })
  maintenanceMessage: string | null;

  @Column({ name: 'maintenance_starts_at', type: 'timestamptz', nullable: true })
  maintenanceStartsAt: Date | null;

  @Column({ name: 'maintenance_expected_end_at', type: 'timestamptz', nullable: true })
  maintenanceExpectedEndAt: Date | null;

  @Column({ name: 'maintenance_severity', type: 'varchar', length: 20, default: 'warning' })
  maintenanceSeverity: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
