import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {NavigatorService} from "@typexs/ng-base";


@Injectable()
export class StartupService {

  constructor(private navigator: NavigatorService, private router: Router) {
    console.log(navigator)
    this.navigator.addGroupEntry('user/.*', {label: 'User'});
    let demoEntries = this.navigator.getEntry('demo')
    let entries = this.navigator.getEntriesByPathPattern(/^user\//);
    entries.forEach(e => {
      e.setParent(demoEntries);
    })
    let routes = this.navigator.getRebuildRoutes();

    router.resetConfig(routes);
    this.navigator.read(router.config);
    //console.log(router.);
  }
}
