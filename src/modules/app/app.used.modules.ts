// generated by typexs-ng
import {APP_ROUTES} from './app.routes';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {ModuleWithProviders} from '@angular/core';
import {Type} from '@angular/core';
import {UserModule} from '../user/user.module';
import {CommonModule} from "@angular/common";

export const APP_MODULES: Array<Type<any> | ModuleWithProviders | any[]> = [
  BrowserModule,
  UserModule,

  RouterModule.forRoot(APP_ROUTES)
];
