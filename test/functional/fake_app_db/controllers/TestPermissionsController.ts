import {CurrentUser, Get, JsonController} from 'routing-controllers';
import {Access, ContextGroup} from '@typexs/server';


@ContextGroup('api')
@JsonController()
export class TestPermissionsController {

  @Access('check test permission')
  @Get('/permissionsTest')
  test(@CurrentUser() user: any) {
    return {test: 'welt'};
  }

}
