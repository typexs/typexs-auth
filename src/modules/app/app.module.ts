import {NgModule} from '@angular/core';
import {Router} from '@angular/router';
import {AppComponent} from './app.component';
import {APP_MODULES} from "./app.used.modules";
import {DemosComponent} from "./demos/demos.component";
import {NavigatorService} from "@typexs/ng-base";


@NgModule({
  declarations: [
    AppComponent,
    DemosComponent
  ],
  imports: APP_MODULES,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(private navigator: NavigatorService, private router: Router) {

    this.navigator.addGroupEntry('user/.*', {label: 'User'});

    let demoEntries = this.navigator.getEntry('demo');
    let entries = this.navigator.getEntriesByPathPattern(/^user\//);
    entries.forEach(e => {
      e.setParent(demoEntries);
    });
    let routes = this.navigator.getRebuildRoutes();

    router.resetConfig(routes);
    this.navigator.read(router.config);
  }


}
