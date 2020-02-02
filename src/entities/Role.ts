// import {Asc, Entity, From, Join, Property, To} from "@typexs/schema/browser";
// import {And, Eq, Key, Value} from "commons-expressions/browser";
// import {RBelongsTo} from "./RBelongsTo";
// import {FormReadonly} from "@typexs/ng/browser";
// import {Permission} from "./Permission";
//
//
// @Entity()
// export class Role {
//
//   @Property({type: 'number', auto: true})
//   id: number;
//
//   @Property({type: 'string', typeorm: {unique: true}})
//   rolename: string;
//
//   @Property({type: 'string', nullable: true})
//   displayName: string;
//
//   @Property({type: 'boolean'})
//   disabled: boolean = false;
//
//   @Property({
//     type: 'Permission', cardinality: 0,
//     join: Join(RBelongsTo, [
//         From(Eq('ownerid', Key('id'))),
//         To(Eq('id', Key('refid')))
//       ],
//       And(
//         Eq('ownertab', Value('role')),
//         Eq('reftab', Value('permission'))),
//       [Asc(Key('sort')), Asc(Key('id'))])
//   })
//   permissions: Permission[];
//
//   @FormReadonly()
//   @Property({type: 'date:created'})
//   created_at: Date;
//
//   @FormReadonly()
//   @Property({type: 'date:updated'})
//   updated_at: Date;
//
//
//   // TODO has a list of permissions
//
//   label() {
//     if (this.displayName) {
//       return this.displayName;
//     }
//     return this.rolename;
//   }
// }
