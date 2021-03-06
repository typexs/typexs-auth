// generated by @typexs/ng
import {APP_ROUTES} from './routes';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {ModuleWithProviders, Type} from '@angular/core';
import {UserModule} from '../user/module';
import {
  AdminModule,
  BaseAdminThemeModule, BaseModule,
  DistributedStorageModule,
  EntityModule,
  FormsModule,
  NavigatorModule,
  StorageModule
} from '@typexs/ng-base';
import {UserAdminModule} from '../users-administrator/module';
import {HttpClientModule} from '@angular/common/http';


export const APP_MODULES: Array<Type<any> | ModuleWithProviders<any> | any[]> = [
  BrowserModule,
  HttpClientModule,
  NavigatorModule,
  FormsModule,
  RouterModule.forRoot(APP_ROUTES),
  AdminModule,
  BaseModule.forRoot(),
  BaseAdminThemeModule,
  StorageModule,
  EntityModule,
  DistributedStorageModule,
  UserModule.forRoot(),
  UserAdminModule.forRoot(),

];
