
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserProfileComponent} from './user_profile.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [UserProfileComponent],
  imports: [
    RouterModule.forChild([
        {path: 'user', component: UserProfileComponent, data: {label: 'Profile'}}
      ]
    ),
    HttpClientModule
  ],
  exports: [RouterModule]
})
export class UserModule {
}
