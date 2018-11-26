import {Routes} from "@angular/router";
import {DemosComponent} from "./demos/demos.component";


export const APP_ROUTES: Routes = [
  {
    path: 'demo',
    component: DemosComponent,
    data: {label: 'Demo'},
  },
  {
    path: '', redirectTo: 'demo', pathMatch: 'full'
  },
  {
    path: '**', redirectTo: 'demo'
  }

];





