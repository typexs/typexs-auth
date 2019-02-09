import {Asc, Entity, From, Join, Property, To} from "@typexs/schema/browser";

import {And,  Eq, Key,  Value} from "commons-expressions/browser";
import {RBelongsTo} from "./RBelongsTo";
import {Role} from "./Role";
import {FormReadonly} from "@typexs/ng/browser";

@Entity()
export class Permission {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  permission: string;

  @Property({type: 'string', typeorm: {index: true}})
  module: string;

  // Is single permission or permission pattern ...
  @Property({type: 'string', typeorm: {index: true}})
  type: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({
    type: 'Role', cardinality: 0,
    join: Join(RBelongsTo, [
        From(Eq('refid', Key('id'))),
        To(Eq('id', Key('ownerid')))
      ],
      And(
        Eq('ownertab', Value('role')),
        Eq('reftab', Value('permission'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  roles: Role[];

  @FormReadonly()
  @Property({type: 'date:created'})
  created_at: Date;

  @FormReadonly()
  @Property({type: 'date:updated'})
  updated_at: Date;



  label() {
    return this.permission;
  }
}
