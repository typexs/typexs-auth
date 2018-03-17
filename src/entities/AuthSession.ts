import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import {AuthUser} from "./AuthUser";
import * as _ from "lodash";
import {AuthMethod} from "./AuthMethod";


@Entity()
export class AuthSession {

  @PrimaryColumn({type: 'varchar', length: 64})
  token: string;

  @Column({type: 'varchar', length: 15})
  ip: string;

  @OneToOne(type => AuthUser,{nullable:true})
  @JoinColumn()
  user: AuthUser = null;


  @Column({nullable: false})
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
