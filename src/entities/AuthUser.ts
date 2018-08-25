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
import {IAuthUser} from "../libs/models/IAuthUser";


@Entity()
export class AuthUser implements IAuthUser {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  username: string;

  @Column({unique: true})
  mail: string;

  @Column({nullable: true})
  displayName: string;

  @Column()
  disabled: boolean = false;

  @OneToMany(type => AuthMethod, auth => auth.user)
  authMethods: AuthMethod[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}
