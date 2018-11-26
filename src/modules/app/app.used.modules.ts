// generated by @typexs/ng
import {APP_ROUTES} from './app.routes';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {ModuleWithProviders, Type} from '@angular/core';
import {UserModule} from "../user/user.module";
import {AdminModule, FormsModule, NavigatorModule, ViewsModule} from "@typexs/ng-base";


export const APP_MODULES: Array<Type<any> | ModuleWithProviders | any[]> = [
  BrowserModule,
  UserModule.forRoot(),
  NavigatorModule,
  FormsModule,
  ViewsModule,
  RouterModule.forRoot(APP_ROUTES),
  AdminModule
];
