// import {
//   AfterInsert,
//   AfterLoad,
//   AfterUpdate,
//   BeforeInsert,
//   BeforeUpdate,
//   Column,
//   CreateDateColumn,
//   Entity,
//   PrimaryColumn,
//   UpdateDateColumn
// } from 'typeorm';
//
import {Entity, Property} from '@typexs/schema/browser';


@Entity()
export class AuthSession {

  @Property({type: 'string', id: true})
  token: string;

  @Property({type: 'string'})
  ip: string;

  @Property()
  userId: number = null;

  @Property()
  authId: string;

  @Property({nullable: true})
  data: any = null;

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;


  // @BeforeInsert()
  // bin() {
  //   if (!_.isString(this.data)) {
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
  //   if (_.isString(this.data)) {
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
