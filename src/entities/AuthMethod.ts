import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  Index,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

import * as _ from "lodash";
import {AuthUser} from "./AuthUser";


@Entity()
@Index(["authId", "identifier"], {unique: true})
export class AuthMethod {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => AuthUser, user => user.authMethods, {nullable: true})
  user: AuthUser;

  userId: number;

  @Column()
  authId: string;

  @Column()
  type: string;

  @Column({nullable: true})
  mail: string;

  /**
   * default marker
   * @type {boolean}
   */
  @Column()
  standard: boolean = false;

  @Column()
  identifier: string;

  @Column({nullable: true})
  secret: string;

  @Column()
  failed: number = 0;

  @Column()
  failLimit: number = 100;

  @Column()
  disabled: boolean = false;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({type: 'text', nullable: true})
  data: any = null;


  @BeforeInsert()
  bin() {
    if (!_.isString(this.data)) {
      this.data = JSON.stringify(this.data);
    }
  }

  @BeforeUpdate()
  bup() {
    this.bin()
  }


  @AfterLoad()
  load() {
    if (_.isString(this.data)) {
      this.data = JSON.parse(this.data);
    }
  }

  @AfterInsert()
  ain() {
    this.load()
  }

  @AfterUpdate()
  aup() {
    this.load()
  }


}
