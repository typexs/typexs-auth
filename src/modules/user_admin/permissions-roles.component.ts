import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {ISelectOption} from "@typexs/ng-base/modules/forms/libs/ISelectOption";
import {EntityService, FormGrid, IMessage, MessageChannel, MessageService, MessageType} from "@typexs/ng-base";
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

  matrixReady: boolean = false;

  private channel: MessageChannel<IMessage>;

  private roles: Role[] = [];

  private permissions: Permission[] = [];

  result: any;

  constructor(private entityService: EntityService,
              private messageService: MessageService) {
    this.channel = messageService.get('form.permissions-roles');
  }

  isReady() {
    let permissionsMatrix = new PermissionMatrix();

    this.entityService.query('Permission').subscribe((permissions) => {
      if (permissions) {
        this.permissions = permissions.entities;

        this.entityService.query('Role').subscribe((roles) => {
          if (roles) {
            this.roles = roles.entities;
            let roleNames = roles.entities.map((r: Role) => <ISelectOption>{value: r.rolename, label: r.displayName});
            this.permissions.forEach((p: Permission) => {
              let per = new PermissionData();
              per.permission = p.permission;
              per.roles = _.map(p.roles, r => r.rolename);
              per.roleNames = _.clone(roleNames);
              permissionsMatrix.permissions.push(per);
            });
            permissionsMatrix.permissions = _.orderBy(permissionsMatrix.permissions, ['permission']);
            this.permissionsMatrix = permissionsMatrix;
            this.matrixReady = true;
          }
        });
      }
    });
  }


  ngOnInit(): void {
    this.entityService.isReady(this.isReady.bind(this));
  }


  onSubmit($event: any) {
    if ($event.data.isSuccessValidated) {
      let instance: PermissionMatrix = $event.data.instance;

      let tosave: Permission[] = [];
      instance.permissions.forEach(p => {
        let permission: Permission = _.find(this.permissions, _p => _p.permission == p.permission);
        permission.roles = _.filter(this.roles, _r => p.roles.indexOf(_r.rolename) !== -1);
        tosave.push(permission);
      });

      let observable = this.entityService.save('Permission', tosave);
      observable.subscribe((v: any) => {
        if (v) {
          // TODO saved in form user
          this.channel.publish({
            type:MessageType.Success,
            content: 'Permissions successful saved.'
          });
        }
      }, (error: Error) => {
        console.error(error);
        this.channel.publish({
          type:MessageType.Error,
          content: error.message
        });
      })

    } else {
      this.channel.publish({
        type:MessageType.Error,
        content: 'Validation failed.'
      });
    }

  }
}
