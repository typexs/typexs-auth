import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {AuthService} from '@typexs/ng-base';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(public auth: AuthService) {
  }


  async ngOnInit() {
  }


  isAuthenticated() {
    return this.auth.isLoggedIn();
  }
}


