import {Observable} from 'rxjs';
import * as _ from "lodash";

export class Helper {

  static after<T>(init: Observable<T> | Promise<T> | T, after: (e: T) => void) {
    if (!!init && 'function' === typeof (<any>init).subscribe) {
      (<any>init).subscribe((s: any) => {
        if (s) {
          after(s);
        }
      })
    } else if (!!init && 'function' === typeof (<any>init).then) {
      (<any>init).then((s: any) => {
        if (s) {
          after(s);
        }
      })
    } else {
      after(<T>init);
    }

  }
}
