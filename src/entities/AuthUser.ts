import {
  Column,
  JoinColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import {AuthMethod} from "./AuthMethod";


@Entity()
export class AuthUser {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  username: string;

  @Column({unique: true})
  mail: string;

  @Column()
  disabled: boolean = false;

  @OneToOne(type => AuthMethod)
  @JoinColumn()
  preferedMethod: AuthMethod;

  @OneToMany(type => AuthMethod, auth => auth.user)
  authMethods: AuthMethod[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}
