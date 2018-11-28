import {CObject} from "@typexs/schema/libs/decorators/CObject";
import {Property} from "@typexs/schema/libs/decorators/Property";


@CObject({name: 'r_belongsto'})
export class RBelongsTo {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  ownertab: string;

  @Property({type: 'number'})
  ownerid: number;

  @Property({type: 'string'})
  reftab: string;

  @Property({type: 'number'})
  refid: number;

  // TODO mark as seqnr replacement
  @Property({type: 'number', nullable: true, sequence: true})
  sort: number = 0;

  @Property({type: 'date:updated', nullable: true})
  updated_at: Date;

}
