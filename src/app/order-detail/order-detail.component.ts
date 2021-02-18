import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  subs: Subscription;
  Data: any[];
  loading: boolean;
  id: number;
  customer: string;
  rank: string;
  subtotal: number;
  discount: number;
  ordertotal: number;

  constructor(
    public bsModalRef: BsModalRef,
    private be: BackendService
  ) {

  }

  ngOnInit() {
    this.getData();
  }

  getData() {
    let params: Dsmodel = {
      cols: `p.name as product,o.price,o.qty,o.discount,o.total,c.name as class`,
      table: '`orderdet` o',
      //order: `${order? order : 'date DESC'}`,
      wc: 'ordernumber='+this.id,
      join: `left join products p on p.id=o.product left join classifications c on c.id = p.class_id`
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.Data = [...d];
    }, (err) => {
      this.loading = false;
        //console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
    }, () => this.loading = false);
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
