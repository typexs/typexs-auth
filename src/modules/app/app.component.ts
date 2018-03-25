import {Component, ViewEncapsulation} from '@angular/core';
import {AuthService} from "../user/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'app';

  constructor(public auth:AuthService){}
}


