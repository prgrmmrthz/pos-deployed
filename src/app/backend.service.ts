import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Dsmodel } from './dsmodel.Interface';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private gu = 'http://localhost/api/general';
  //private gu = 'http://localhost:36076/api/general';
  //private gu = 'http://localhost:4000/general';

  constructor(private http: HttpClient) { }

  getDataWithJoinClause(p: Dsmodel) {
    let a={
      cols: p.cols,
      table: p.table,
      join: p.join || '',
      wc: p.wc || '',
      limit: p.limit || '',
      order: p.order || ''
    }
    const u = `${this.gu}/getDataWithJoinClause?`
    return this.http.post<any[]>(u, a, httpOptions);
  }

  updateData(p: Dsmodel) {
    const u = `${this.gu}/updateData?`
    return this.http.post<any[]>(u, p, httpOptions);
  }

  callSP(dataX: Object): any {
    let url = `${this.gu}/callSP`
    return this.http.post(url, dataX, httpOptions);
  }

  deleteRecord(id: number, table: string, wc: string) {
   const url = `${this.gu}/Delete?id=${id}&table=${table}&wc=${wc}`;
   return this.http.delete(url, httpOptions);
  }
}
