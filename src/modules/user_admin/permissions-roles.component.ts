import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {ISelectOption} from "@typexs/ng-base/modules/forms/libs/ISelectOption";
import {IProperty} from "@typexs/schema/libs/registry/IProperty";
import {EntityService, FormGrid} from "@typexs/ng-base";
import {Role} from "../../entities/Role";
import {Permission} from "../../entities/Permission";


@Entity({storeable: false})
export class PermissionData {

  @Property({type: 'string', form: 'label'})
  permission: string;

  @Property({type: 'string', form: 'checkbox', enum: 'roleNames', cardinality: 0})
  roles: string[];

  roleNames: ISelectOption[] = [];
}

@Entity({storeable: false})
export class PermissionMatrix {

  @FormGrid({fixed: true, nr: false})
  @Property({type: PermissionData, cardinality: 0})
  permissions: PermissionData[] = [];

}




@Component({
  selector: 'permissions-rights-overview',
  templateUrl: './permissions-roles.component.html',
})
export class PermissionsRolesComponent implements OnInit {

  permissionsMatrix: PermissionMatrix;

  matrixReady:boolean = false;

  result: any;

  constructor(private entityService: EntityService) {
  }

  isReady() {
    let permissionsMatrix = new PermissionMatrix();

    this.entityService.query('Permission').subscribe((permissions) => {
      if (permissions) {

        this.entityService.query('Role').subscribe((roles) => {
          if (roles) {
            let roleNames = roles.entities.map((r: Role) => <ISelectOption>{value: r.rolename, label: r.displayName});
            permissions.entities.forEach((p: Permission) => {
              let per = new PermissionData();
              per.permission = p.permission;
              per.roles = [];
              per.roleNames = _.clone(roleNames);
              permissionsMatrix.permissions.push(per);
            });
            permissionsMatrix.permissions = _.orderBy(permissionsMatrix.permissions, ['permission']);
            this.permissionsMatrix = permissionsMatrix;
            this.matrixReady = true;
            console.log(this.permissionsMatrix, permissionsMatrix);

          }
        });
      }
    });
  }

  ngOnInit(): void {

    this.entityService.isReady(this.isReady.bind(this));

  }

  onSubmit($event: any) {
    console.log($event)
  }
}
