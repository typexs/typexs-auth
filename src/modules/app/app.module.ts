import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_MODULES} from "./app.used.modules";


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: APP_MODULES,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

}
