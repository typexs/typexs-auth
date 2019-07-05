import * as _ from 'lodash';
import {Component, OnInit, OnDestroy} from '@angular/core';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {ISelectOption} from '@typexs/ng-base/modules/forms/libs/ISelectOption';
import {EntityService, IMessage, MessageChannel, MessageService, MessageType} from '@typexs/ng-base';
import {Role} from '../../entities/Role';
import {Permission} from '../../entities/Permission';
import {FormLabel} from '@typexs/ng/libs/forms/decorators/FormLabel';
import {FormCheckbox} from '@typexs/ng/libs/forms/decorators/FormCheckbox';
import {FormGrid} from '@typexs/ng/libs/forms/decorators/FormGrid';


@Entity({storeable: false})
export class PermissionData {

  @FormLabel()
  @Property({type: 'string'})
  permission: string;

  @FormCheckbox()
  @Property({type: 'string',  enum: 'roleNames', cardinality: 0})
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
export class PermissionsRolesComponent implements OnInit, OnDestroy {

  permissionsMatrix: PermissionMatrix;

  matrixReady = false;

  channel: MessageChannel<IMessage>;

  private roles: Role[] = [];

  private permissions: Permission[] = [];

  result: any;

  constructor(private entityService: EntityService,
              private messageService: MessageService) {

  }

  isReady() {
    const permissionsMatrix = new PermissionMatrix();

    this.entityService.query('Permission').subscribe((permissions) => {
      if (permissions) {
        this.permissions = permissions.entities;

        this.entityService.query('Role').subscribe((roles) => {
          if (roles) {
            this.roles = roles.entities;
            const roleNames = roles.entities.map((r: Role) => <ISelectOption>{value: r.rolename, label: r.displayName});
            this.permissions.forEach((p: Permission) => {
              const per = new PermissionData();
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
    this.channel = this.messageService.get('form.permissions-roles');
    this.entityService.isReady(this.isReady.bind(this));
  }

  ngOnDestroy(): void {
    this.channel.finish();
  }


  onSubmit($event: any) {
    if ($event.data.isSuccessValidated) {
      const instance: PermissionMatrix = $event.data.instance;

      const tosave: Permission[] = [];
      instance.permissions.forEach(p => {
        const permission: Permission = _.find(this.permissions, _p => _p.permission == p.permission);
        permission.roles = _.filter(this.roles, _r => p.roles.indexOf(_r.rolename) !== -1);
        tosave.push(permission);
      });

      const observable = this.entityService.save('Permission', tosave);
      observable.subscribe((v: any) => {
        if (v) {
          // TODO saved in form user
          this.channel.publish({
            type: MessageType.SUCCESS,
            content: 'Permissions successful saved.'
          });
        }
      }, (error: Error) => {
        console.error(error);
        this.channel.publish({
          type: MessageType.SUCCESS,
          content: error.message
        });
      });

    } else {
      this.channel.publish({
        type: MessageType.ERROR,
        content: 'Validation failed.'
      });
    }

  }
}
