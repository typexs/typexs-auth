import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  Index,
  Entity,
  Column,
  UpdateDateColumn,
  PrimaryGeneratedColumn
} from "typeorm";

import * as _ from "lodash";
import {IAuthMethod} from "../libs/models/IAuthMethod";


@Entity()
@Index(["authId", "identifier"], {unique: true})
export class AuthMethod implements IAuthMethod {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'varchar', length: 128})
  authId: string;

  @Column({type: 'varchar', length: 32})
  type: string;

  @Column({type: 'varchar', length: 256, nullable: true})
  mail: string;

  @Column({type: 'int'})
  userId: number;

  /**
   * default marker
   * @type {boolean}
   */
  @Column()
  standard: boolean = false;

  @Column({type: 'varchar', length: 256, nullable: true})
  identifier: string;

  @Column({type: 'varchar', length: 256, nullable: true})
  secret: string;

  @Column({type: 'int'})
  failed: number = 0;

  @Column({type: 'int'})
  failLimit: number = 100;

  @Column()
  disabled: boolean = false;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({type: 'text'})
  data: any = null;


  @BeforeInsert()
  bin() {
    if (this.data && !_.isString(this.data)) {
      this.data = JSON.stringify(this.data);
    }
  }

  @BeforeUpdate()
  bup() {
    this.bin()
  }


  @AfterLoad()
  load() {
    if (this.data && _.isString(this.data)) {
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
