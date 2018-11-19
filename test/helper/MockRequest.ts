

export class MockRequest {
  headers:any = {};

  setHeader(k:string,v:string) {
    this.headers[k] = v;
  }

  removeHeader(k:string){
    delete this.headers[k];
  }
}
