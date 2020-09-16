// import {
//   AfterInsert,
//   AfterLoad,
//   AfterUpdate,
//   BeforeInsert,
//   BeforeUpdate,
//   CreateDateColumn,
//   Index,
//   Entity,
//   Column,
//   UpdateDateColumn,
//   PrimaryGeneratedColumn
// } from 'typeorm';

import {IAuthMethod} from '../libs/models/IAuthMethod';
import {Entity, Property} from '@typexs/schema/browser';


@Entity()
// @Index(['authId', 'identifier'], {unique: true})
export class AuthMethod implements IAuthMethod {

  @Property({auto: true})
  id: number;

  @Property({type: 'string', length: 128})
  authId: string;

  @Property({type: 'string', length: 32})
  type: string;

  @Property({type: 'string', length: 256, nullable: true})
  mail: string;

  @Property()
  userId: number;

  /**
   * default marker
   * @type {boolean}
   */
  @Property()
  standard: boolean = false;

  @Property({type: 'string', length: 256, nullable: true})
  identifier: string;

  @Property({type: 'string', length: 256, nullable: true})
  secret: string;

  @Property()
  failed: number = 0;

  @Property()
  failLimit: number = 100;

  @Property()
  disabled: boolean = false;

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;

  @Property({nullable: true})
  data: any = null;

  //
  // @BeforeInsert()
  // bin() {
  //   if (this.data && !_.isString(this.data)) {
  //     this.data = JSON.stringify(this.data);
  //   }
  // }
  //
  // @BeforeUpdate()
  // bup() {
  //   this.bin();
  // }
  //
  //
  // @AfterLoad()
  // load() {
  //   if (this.data && _.isString(this.data)) {
  //     this.data = JSON.parse(this.data);
  //   }
  // }
  //
  // @AfterInsert()
  // ain() {
  //   this.load();
  // }
  //
  // @AfterUpdate()
  // aup() {
  //   this.load();
  // }


}
