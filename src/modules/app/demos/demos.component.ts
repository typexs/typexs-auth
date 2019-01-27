import {Component} from '@angular/core';


@Component({
  templateUrl:'./demos.component.html'
})
export class DemosComponent  {


//  _isAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
/*
  ngOnInit(): Promise<void> {
    this.title = 'TypexsAuth';
    this.menuOptions = {
      base: 'demo'
    };
    this.baseRouterLink = '/demo';
    this.userRouterLinks.logout = '/demo/user';
    this.userRouterLinks.logout = '/demo/user/logout';

    return super.ngOnInit();
  }
*/
  /*
    constructor(private auth: AuthService, private messageService: MessageService) {
      messageService.get('UserAuthService').subscribe(this.onMessage.bind(this))
    }
  */
  /*
    async onMessage(m: any) {

      if (m instanceof UserAuthMessage) {
        if (this.auth.isLoggedIn()) {
          let isAdmin = await this.auth.hasRole('admin');
          console.log('isAdmin', isAdmin);
          this._isAdmin.next(isAdmin);
        } else {
          this._isAdmin.next(false);
        }


      }
    }

    get isAdmin(): Observable<boolean> {
      return this._isAdmin.asObservable();
    }

    isAuthenticated() {
      return this.auth.isLoggedIn();
    }


    /*
    isAdmin():Observable<boolean>{
      let subject = new BehaviorSubject<boolean>(false);
      if(this.auth.isLoggedIn()){
        let has:any = this.auth.hasRole('admin');
        if(_.isBoolean(has)){
          subject.next(has);
          subject.complete();
        }else{
          has.then((x:boolean) => {
            subject.next(x);
            subject.complete();
          })
        }
      }else {
        subject.next(false);
        subject.complete();
      }
      return subject.asObservable()

    }
    */
}
