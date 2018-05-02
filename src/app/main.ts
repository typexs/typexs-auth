import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

// Theme initialization
import {ThemeRegistry} from 'typexs-ng/libs/angular/ThemeRegistry';

import {THEMES} from './themes';
import {STYLES} from './stylesheets';
ThemeRegistry.register(THEMES, STYLES);

import {AppModule} from './../modules/app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
