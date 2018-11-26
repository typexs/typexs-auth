import {IAuthUser} from "../libs/models/IAuthUser";
import {Entity, Property} from "@typexs/schema";


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

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;

}
