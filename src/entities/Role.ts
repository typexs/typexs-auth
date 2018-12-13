import {IAuthUser} from "../libs/models/IAuthUser";
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {And, Asc, Eq, From, Join, Key, To, Value} from "@typexs/schema";
import {RBelongsTo} from "./RBelongsTo";
import {Permission} from "./Permission";

import {FormReadonly} from "@typexs/ng/libs/forms/decorators/FormReadonly";


@Entity()
export class Role {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  rolename: string;

  @Property({type: 'string', nullable: true})
  displayName: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({
    type: 'Permission', cardinality: 0,
    join: Join(RBelongsTo, [
        From(Eq('ownerid', Key('id'))),
        To(Eq('id', Key('refid')))
      ],
      And(
        Eq('ownertab', Value('role')),
        Eq('reftab', Value('permission'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  permissions: Permission[];

  @FormReadonly()
  @Property({type: 'date:created'})
  created_at: Date;

  @FormReadonly()
  @Property({type: 'date:updated'})
  updated_at: Date;


  // TODO has a list of permissions

  label() {
    if (this.displayName) {
      return this.displayName;
    }
    return this.rolename;
  }
}
