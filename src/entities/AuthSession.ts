import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";

import * as _ from "lodash";


@Entity()
export class AuthSession {

  @PrimaryColumn({type: 'varchar', length: 64})
  token: string;

  @Column({type: 'varchar', length: 64})
  ip: string;

  @Column({type:'int'})
  userId: number = null;

  @Column()
  authId: string;

  @Column({type: 'text', nullable: true})
  data: any = null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;


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
