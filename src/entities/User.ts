import {IAuthUser} from "../libs/models/IAuthUser";
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {Permission} from "./Permission";
import {And, Asc, Eq, From, Join, Key, To, Value} from "@typexs/schema";
import {RBelongsTo} from "./RBelongsTo";
import {Role} from "./Role";


@Entity()
export class User implements IAuthUser {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  username: string;

  @Property({type: 'string', typeorm: {unique: true}})
  mail: string;

  @Property({type: 'string', nullable: true})
  displayName: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({
    type: 'Role', cardinality: 0,
    join: Join(RBelongsTo, [
        From(Eq('ownerid', Key('id'))),
        To(Eq('id', Key('refid')))
      ],
      And(
        Eq('ownertab', Value('user')),
        Eq('reftab', Value('role'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  roles: Role[];


  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;


  label(){
    if(this.displayName){
      return this.displayName;
    }
    return this.username;
  }
}
