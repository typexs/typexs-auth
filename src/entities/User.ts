import {OneToMany, Entity, PrimaryColumn, Column} from "typeorm";
import {Auth} from "./Auth";


@Entity()
export class User {

  @PrimaryColumn()
  id: number;

  @Column({unique: true})
  username: string;

  @OneToMany(type => Auth, auth => auth.user)
  auths: Auth[];

}
