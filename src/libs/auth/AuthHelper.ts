import {IAuthAdapter} from '../adapter/IAuthAdapter';
import {AuthDataContainer} from './AuthDataContainer';
import {AbstractUserSignup} from '../models/AbstractUserSignup';
import {AbstractUserLogin} from '../models/AbstractUserLogin';
import {AuthMethod} from '../../entities/AuthMethod';
import * as _ from 'lodash';
import {User} from '../../entities/User';

import {EntityController} from '@typexs/schema';
import {ConnectionWrapper, Invoker} from '@typexs/base';
import {IConfigUser} from '../models/IConfigUser';
import {DefaultUserSignup} from '../models/DefaultUserSignup';
import {AuthManager} from './AuthManager';
import {UserAuthApi} from '../../api/UserAuth.api';
import {ClassType} from 'commons-schema-api';
import {Role} from '@typexs/roles/entities/Role';


export class AuthHelper {

  // static checkPermissions(user: User, permissions: string[]) {
  //   const p: string[] = [];
  //   const hasPermission: string[] = [];
  //   if (user && user.roles && user.roles.length > 0) {
  //     // todo cache this for roles
  //     // TODO Cache.getOrCreate(key,() => {....})
  //     _.map(user.roles, (r: Role) => r.permissions.map(_per => {
  //       p.push(_per.permission.replace('*', '(\\w|\\d|\\s)*'));
  //     }));
  //
  //     if (p.length > 0) {
  //       for (const permission of permissions) {
  //         if ((new RegExp('(' + p.join(')|(') + ')')).test(permission)) {
  //           hasPermission.push(permission);
  //         }
  //       }
  //     }
  //   }
  //   return hasPermission;
  // }

  static async createMethod(invoker: Invoker,
                            adapter: IAuthAdapter,
                            dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    const method = new AuthMethod();
    const signup = dataContainer.instance;
    method.identifier = signup.getIdentifier();
    method.authId = adapter.authId;
    method.type = adapter.type;

    if (_.has(dataContainer, 'data')) {
      method.data = _.get(dataContainer, 'data');
    }

    await invoker.use(UserAuthApi).onLoginMethod(method, adapter, dataContainer);

    if (!method.mail) {
      if (signup instanceof AbstractUserSignup) {
        method.mail = signup.getMail();
      } else if (signup instanceof AbstractUserLogin) {
        // mail could be passed by freestyle data object
        if (_.has(dataContainer, 'data.mail')) {
          method.mail = _.get(dataContainer, 'data.mail');
        }
      }
    }


    if (!method.mail) {
      // TODO create MailError
      throw new Error('no mail was found in data');
    }
    return method;
  }


  static async createUser(connection: ConnectionWrapper,
                          invoker: Invoker,
                          adapter: IAuthAdapter,
                          dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    const user = new User();
    const signup = dataContainer.instance;
    user.username = signup.getIdentifier();
    user.approved = adapter.canAutoApprove();

    const roleName = adapter.getDefaultRole();
    if (roleName) {
      user.roles = await connection.manager.getRepository(Role).find({where: {rolename: roleName}}) as Role[];
    }

    await invoker.use(UserAuthApi).onUserCreate(user, adapter, dataContainer);

    if (!user.mail) {
      if (signup instanceof AbstractUserSignup) {
        user.mail = signup.getMail();
      } else if (signup instanceof AbstractUserLogin) {
        // mail could be passed by freestyle data object
        if (_.has(dataContainer, 'data.mail')) {
          user.mail = _.get(dataContainer, 'data.mail');
        }
      }
    }

    if (!user.mail) {
      // TODO create MailError
      throw new Error('no mail was found for the user account');
    }
    return user;
  }


  static async createUserAndMethod(invoker: Invoker,
                                   controller: EntityController,
                                   adapter: IAuthAdapter,
                                   dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    const c = await controller.storageRef.connect();
    let user = await AuthHelper.createUser(c, invoker, adapter, dataContainer);
    // user = await controller.save(user);
    return c.manager.transaction(async em => {
      user = await em.save(user);
      const method = await AuthHelper.createMethod(invoker, adapter, dataContainer);
      method.standard = true;
      method.userId = user.id;
      return em.save(method);
    }).then(r => {
      return {user: user, method: r};
    });
  }

  private static async buildOrWhere<T>(c: ConnectionWrapper, type: ClassType<T>, list: string[], key: string) {
    const repo = c.manager.getRepository(type);
    const q = repo.createQueryBuilder('p');
    let inc = 0;
    for (const perm of list) {
      const d = {};
      const k = 'p' + (inc++);
      d[k] = perm;
      q.orWhere('p.' + key + ' = :' + k, d);
    }
    return await q.getMany();
  }


  // static async initRoles(entityController: EntityController, roles: IConfigRole[]): Promise<Role[]> {
  //   // TODO check if autocreation is enabled
  //   let permissions: string[] = [];
  //   let existing_permissions: Permission[] = [];
  //   let existing_roles: Role[] = [];
  //
  //   _.map(roles, role => permissions = permissions.concat(role.permissions));
  //   const rolenames = _.map(roles, role => role.role);
  //   const c = await entityController.storageRef.connect();
  //
  //   if (permissions.length > 0) {
  //     existing_permissions = await this.buildOrWhere(c, Permission, permissions, 'permission');
  //     existing_permissions.map(p => _.remove(permissions, _p => _p === p.permission));
  //   }
  //
  //   if (rolenames.length > 0) {
  //     existing_roles = await this.buildOrWhere(c, Role, rolenames, 'rolename');
  //     existing_roles.map(r => _.remove(roles, _r => _r.role === r.rolename));
  //   }
  //
  //
  //   if (permissions.length > 0) {
  //
  //     let save_permissions: Permission[] = [];
  //     _.uniq(permissions).map(p => {
  //       const permission = new Permission();
  //       permission.permission = p;
  //       permission.type = /\*/.test(p) ? 'pattern' : 'single';
  //       permission.module = 'system';
  //       permission.disabled = false;
  //       save_permissions.push(permission);
  //     });
  //
  //     save_permissions = await c.manager.save(save_permissions);
  //     existing_permissions = _.concat(existing_permissions, save_permissions);
  //   }
  //
  //   if (roles.length > 0) {
  //     const save_roles: Role[] = [];
  //     roles.map(r => {
  //       const role = new Role();
  //       role.rolename = r.role;
  //       role.displayName = r.displayName;
  //       role.disabled = false;
  //       role.permissions = _.map(r.permissions, p => existing_permissions.find(_p => _p.permission === p));
  //       save_roles.push(role);
  //     });
  //     return await entityController.save(save_roles);
  //   }
  //
  //   return [];
  // }

  static async initUsers(invoker: Invoker,
                         entityController: EntityController,
                         authManager: AuthManager,
                         users: IConfigUser[]): Promise<User[]> {
    // TODO check if autocreation is enabled
    if (users.length === 0) {
      return [];
    }
    const c = await entityController.storageRef.connect();
    const exists_users = await this.buildOrWhere(c, User, _.map(users, user => user.username), 'username');


    // remove already created users
    exists_users.map(u => _.remove(users, _u => _u.username === u.username));

    if (users.length === 0) {
      return [];
    }

    let rolenames: string[] = [];
    _.map(users, u => u.roles && _.isArray(u.roles) ? rolenames = rolenames.concat(u.roles) : null);

    let existing_roles: Role[] = [];
    if (rolenames.length > 0) {
      existing_roles = await this.buildOrWhere(c, Role, rolenames, 'rolename');
      existing_roles.map(r => _.remove(rolenames, _r => _r === r.rolename));
    }
    // let existing_roles = await c.manager.find(Role, {where: {rolename: In(rolenames)}});


    if (rolenames.length > 0) {
      throw new Error('Given roles for users didn\'t exist. ' + JSON.stringify(rolenames));
    }

    const return_users: User[] = [];
    try {

      for (const user of users) {
        // TODO check if user exists

        const adapter = authManager.getAdapter(user.adapter);

        if (!user.mail) {
          user.mail = user.username + '@local.local';
        }

        const signup: DefaultUserSignup = Reflect.construct(adapter.getModelFor('signup'), []);
        _.assign(signup, user);
        signup.passwordConfirm = signup.password;

        const saved = await this.createUserAndMethod(invoker, entityController, adapter, new AuthDataContainer(signup));
        // approve initial user automatically
        saved.user.approved = true;
        if (user.roles && user.roles.length > 0) {
          saved.user.roles = existing_roles.filter(r => user.roles.indexOf(r.rolename) !== -1);
        }
        await entityController.save(saved.user);
        return_users.push(saved.user);


      }
    } catch (e) {
      // TODO create bootstrap error
      throw new Error('can\'t create users, check table user, auth_method');
    }

    // await c.close();
    return return_users;

  }


}
