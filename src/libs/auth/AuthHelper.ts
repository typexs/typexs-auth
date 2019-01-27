import {IAuthAdapter} from "../adapter/IAuthAdapter";
import {AuthDataContainer} from "./AuthDataContainer";
import {AbstractUserSignup} from "../models/AbstractUserSignup";
import {AbstractUserLogin} from "../models/AbstractUserLogin";
import {AuthMethod} from "../../entities/AuthMethod";
import * as _ from "lodash";
import {User} from "../../entities/User";
import {EntityManager, In} from 'typeorm';
import {EntityController} from "@typexs/schema";
import {ConnectionWrapper, Invoker, StorageRef} from "@typexs/base";
import {IConfigUser} from "../models/IConfigUser";
import {DefaultUserSignup} from "../models/DefaultUserSignup";
import {Role} from "../../entities/Role";
import {IConfigRole} from "../models/IConfigRole";
import {Permission} from "../../entities/Permission";
import {AuthManager} from "./AuthManager";
import {UserAuthApi} from "../../api/UserAuth.api";


export class AuthHelper {

  static checkPermissions(user: User, permissions: string[]) {
    let p: string[] = [];
    let hasPermission:string[] = [];
    if (user && user.roles && user.roles.length > 0) {
      // todo cache this for roles
      // TODO Cache.getOrCreate(key,() => {....})
      _.map(user.roles, (r: Role) => r.permissions.map(_per => {
        p.push(_per.permission.replace('*', '(\\w|\\d|\\s)*'))
      }));

      if (p.length > 0) {
        for (let permission of permissions) {
          if ((new RegExp('(' + p.join(')|(') + ')')).test(permission)) {
            hasPermission.push(permission);
          }
        }
      }
    }
    return hasPermission;
  }

  static async createMethod(invoker: Invoker, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    let method = new AuthMethod();
    let signup = dataContainer.instance;
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
      throw new Error('no mail was found in data')
    }
    return method;
  }


  static async createUser(connection: ConnectionWrapper,
                          invoker: Invoker,
                          adapter: IAuthAdapter,
                          dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    let user = new User();
    let signup = dataContainer.instance;
    user.username = signup.getIdentifier();
    user.approved = adapter.canAutoApprove();

    let roleName = adapter.getDefaultRole();
    if (roleName) {
      user.roles = await connection.manager.getRepository(Role).find({where: {rolename: roleName}});
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
      throw new Error('no mail was found for the user account')
    }
    return user;
  }


  static async createUserAndMethod(invoker: Invoker,
                                   controller: EntityController,
                                   adapter: IAuthAdapter,
                                   dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
    let c = await controller.storageRef.connect();
    let user = await AuthHelper.createUser(c, invoker, adapter, dataContainer);
    user = await controller.save(user);
    return c.manager.transaction(async em => {
      let method = await AuthHelper.createMethod(invoker, adapter, dataContainer);
      method.standard = true;
      method.userId = user.id;
      return em.save(method);
    }).then(r => {
      return {user: user, method: r};
    });
  }


  static async initRoles(entityController: EntityController, roles: IConfigRole[]): Promise<Role[]> {
    // TODO check if autocreation is enabled
    let permissions: string[] = [];
    let existing_permissions: Permission[] = [];
    _.map(roles, role => permissions = permissions.concat(role.permissions));
    let rolenames = _.map(roles, role => role.role);
    let c = await entityController.storageRef.connect();

    if(permissions.length > 0){
      let repo = c.manager.getRepository(Permission);
      let q = repo.createQueryBuilder('p');
      let inc = 0;
      for(let perm of permissions){
        let d = {};
        let k = 'p'+(inc++);
        d[k] = perm;
        q.orWhere('p.permission = :'+k,d);
      }
      existing_permissions = await q.getMany();
    }

    let existing_roles = await c.manager.find(Role, {where: {rolename: In(rolenames)}});
    existing_permissions.map(p => _.remove(permissions, _p => _p == p.permission));
    existing_roles.map(r => _.remove(roles, _r => _r.role == r.rolename));

    if (permissions.length > 0) {

      let save_permissions: Permission[] = [];
      _.uniq(permissions).map(p => {
        let permission = new Permission();
        permission.permission = p;
        permission.type = /\*/.test(p) ? 'pattern' : 'single';
        permission.module = 'system';
        permission.disabled = false;
        save_permissions.push(permission);
      });

      save_permissions = await c.manager.save(save_permissions);
      existing_permissions = _.concat(existing_permissions, save_permissions)
    }

    if (roles.length > 0) {
      let save_roles: Role[] = [];
      roles.map(r => {
        let role = new Role();
        role.rolename = r.role;
        role.displayName = r.displayName;
        role.disabled = false;
        role.permissions = _.map(r.permissions, p => existing_permissions.find(_p => _p.permission == p));
        save_roles.push(role);
      });
      return await entityController.save(save_roles);
    }

    return [];
  }

  static async initUsers(invoker: Invoker,
                         entityController: EntityController,
                         authManager: AuthManager,
                         users: IConfigUser[]): Promise<User[]> {
    // TODO check if autocreation is enabled
    if (users.length == 0) {
      return [];
    }
    let c = await entityController.storageRef.connect();

    let exists_users = await c.manager.find(User, {where: {username: In(_.map(users, user => user.username))}});
    // remove already created users
    exists_users.map(u => _.remove(users, _u => _u.username == u.username));

    if (users.length == 0) {
      return [];
    }

    let rolenames: string[] = [];
    _.map(users, u => u.roles && _.isArray(u.roles) ? rolenames = rolenames.concat(u.roles) : null);

    let existing_roles = await c.manager.find(Role, {where: {rolename: In(rolenames)}});
    existing_roles.map(r => _.remove(rolenames, _r => _r == r.rolename));

    if (rolenames.length > 0) {
      throw new Error('Given roles for users didn\'t exist. '+JSON.stringify(rolenames));
    }


    let return_users: User[] = [];
    for (let user of users) {
      // TODO check if user exists

      let adapter = authManager.getAdapter(user.adapter);

      if (!user.mail) {
        user.mail = user.username + '@local.local';
      }

      let signup: DefaultUserSignup = Reflect.construct(adapter.getModelFor("signup"), []);
      _.assign(signup, user);
      signup.passwordConfirm = signup.password;
      let saved = await this.createUserAndMethod(invoker, entityController, adapter, new AuthDataContainer(signup));
      // approve initial user automatically
      saved.user.approved = true;
      if (user.roles && user.roles.length > 0) {
        saved.user.roles = existing_roles.filter(r => user.roles.indexOf(r.rolename) !== -1);
      }
      await entityController.save(saved.user);
      return_users.push(saved.user);

    }

    //await c.close();
    return return_users;

  }


}
