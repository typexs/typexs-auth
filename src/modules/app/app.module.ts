import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_MODULES} from "./app.used.modules";
import {DemosComponent} from "./demos/demos.component";
import {StartupService} from "./startup.service";


@NgModule({
  declarations: [
    AppComponent,
    DemosComponent
  ],
  imports: APP_MODULES,
  providers: [StartupService],
  bootstrap: [AppComponent]
})
export class AppModule {

}
