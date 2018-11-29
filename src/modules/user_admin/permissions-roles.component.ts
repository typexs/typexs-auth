import {Component, OnInit} from '@angular/core';
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";

@Entity({storeable: false})
export class PermissionData {

  @Property({type: 'string', form: 'label'})
  permission: string;

  @Property({type: 'RoleData', form: 'grid'})
  roles: RoleData[];

}

@Entity({storeable: false})
export class RoleData {

  @Property({type: 'string', form: 'label'})
  rolename: string;


}


@Component({
  selector: 'permissions-rights-overview',
  templateUrl: './permissions-roles.component.html',
})
export class PermissionsRolesComponent {

}
