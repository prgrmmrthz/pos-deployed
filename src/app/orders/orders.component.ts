import { Component, OnInit, OnDestroy } from '@angular/core';
import { BackendService } from '../backend.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dsmodel } from '../dsmodel.Interface';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import Swal from 'sweetalert2/dist/sweetalert2.js';
var jsPDF = require('jspdf');
require('jspdf-autotable');
import {numberWithCommas} from '../utils/format';
import { OrderDetailComponent } from '../order-detail/order-detail.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  frmSearch: FormGroup;
  searchOptions: { hKey: string; value: string; icon: string; }[];
  searchFilterOptions: { hKey: string; value: string; icon: string; }[];
  subs: Subscription;
  Data: any[];
  loading: boolean;
  selectedId:number=0;
  dataItems: any[];
  change: any;
  amountTendered: any;
  ordertotal: any;
  storename: string;
  date: any;
  salesTitle: string ="Daily";
  bsModalRef: BsModalRef;

  constructor(
    private be: BackendService,
    private fb: FormBuilder,
    private modalService: BsModalService
  ) {
    this.frmSearch = this.fb.group({
      filter: ['DATE(o.date) = CURDATE()'],
      option: ['id', Validators.required],
      option2: ['asc']
    });

    this.searchOptions=[
      {hKey: 'id', value: 'Order#', icon: ''},
      {hKey: 'date', value: 'Date', icon: ''},
      {hKey: 'ordertotal', value: 'Total', icon: ''},
      {hKey: 'customer', value: 'Member', icon: ''},
      {hKey: 'r.id', value: 'Rank', icon: ''}
    ];

    this.searchFilterOptions=[
      {
        hKey: 'DATE(o.date) = CURDATE()',
        value: 'Daily',
        icon: 'fa fa-filter'
      },
      {
        hKey: 'MONTH(o.date) = MONTH(CURRENT_DATE()) AND YEAR(o.date) = YEAR(CURRENT_DATE())',
        value: 'Monthly',
        icon: 'fa fa-filter'
      },
      {
        hKey: 'YEAR(o.date) = YEAR(CURRENT_DATE())',
        value: 'Yearly',
        icon: 'fa fa-filter'
      }
    ]
  }

  ngOnInit(): void {
    this.getData();
    this.storename=localStorage.getItem('storename') || '';
  }

  getData(wc?, order?) {
    let params: Dsmodel = {
      cols: `o.id,o.date,o.ordertotal,o.sukli,o.amounttendered,o.subtotal,o.discount,c.name as customer,r.name as rank`,
      table: '`order` o',
      order: `${order? order : 'date DESC'}`,
      wc: `${wc? 'status=1 AND '+wc : 'status=1 AND DATE(o.date) = CURDATE()'}`,
      join: `left join customers c on c.id=o.customer_id left join ranks r on r.id=c.rank_id`
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.Data = [...d];
      this.computeTotal();
    }, (err) => {
      this.loading = false;
        //console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
    }, () => this.loading = false);
  }

  print() {
    const salesTitle = this.salesTitle;
    const dataPrint = this.Data.map((v)=>{
      return {
        date: v.date.replace('T', ' '),
        subtotal: numberWithCommas(Number(v.subtotal).toFixed(2)),
        discount: numberWithCommas(Number(v.discount).toFixed(2)),
        ordertotal: numberWithCommas(Number(v.ordertotal).toFixed(2)),
        id: v.id,
        customer: v.customer,
        rank: v.rank
      }
    });
    dataPrint.push({
      date: "",
      subtotal: "",
      id: "",
      customer: "",
      rank: "",
      discount: "Total Sales",
      ordertotal: numberWithCommas(Number(this.ordertotal).toFixed(2))
    })
    var columns = [
      { title: "Sales#", dataKey: "id" },
      { title: "Date Time", dataKey: "date" },
      { title: "Member", dataKey: "customer" },
      { title: 'Rank', dataKey: 'rank'},
      { title: "Subtotal", dataKey: "subtotal" },
      { title: "Discount", dataKey: "discount" },
      { title: "Total", dataKey: "ordertotal" }
    ];
    var doc = new jsPDF('p', 'pt', 'letter');
    var totalPagesExp = "{total_pages_count_string}";
    doc.autoTable(columns, dataPrint, {
      theme: 'grid',
      startY: false, // false (indicates margin top value) or a number
      tableWidth: 'auto', // 'auto', 'wrap' or a number
      showHead: 'everyPage', // 'everyPage', 'firstPage', 'never'
      tableLineColor: 200, // number, array (see color section below)
      tableLineWidth: 0,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fontStyle: 'bold',
        halign: 'center'
      },
      margin: { top: 160 },
      columnStyles: {
        ordertotal: {
          halign: 'right',
          fontStyle: 'bold'
        },
        discount: {
          halign: 'right'
        },
        subtotal: {
          halign: 'right'
        },
        date: {
          halign: 'center'
        },
        id: {
          halign: 'center',
          columnWidth: 40
        }
/*         totalrelease: {
          halign: 'right',
          columnWidth: 60
        } */
      },
      didDrawPage: function (dataToPrint) {
        //console.debug(dataPrint);
        doc.setFontSize(18);
        doc.text(`${salesTitle} Sales Report`, 40, 80);
        doc.setFontSize(12);
        doc.text(`Date Printed: ${new Date().toLocaleDateString()}`, 40, 100);
        // FOOTER
        var str = "Page " + dataToPrint.pageCount;
        // Total page number plugin only available in jspdf v1.0+
        if (typeof doc.putTotalPages === 'function') {
          str = str + " of " + totalPagesExp;
        }
        doc.setFontSize(10);
        var pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(str, dataToPrint.settings.margin.left, pageHeight - 10);
      }
    });
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }
    var blob = doc.output('blob');
    window.open(URL.createObjectURL(blob));
  }

  selectData(id){
    this.selectedId=id;
  }

  onSearch(){
    setTimeout(()=>{
      const a = this.searchFilterOptions.findIndex((v,i)=> {
        if(v.hKey == this.g('filter'))
          return true;
      });
      this.salesTitle = this.searchFilterOptions[a].value;
      this.getData(`${this.g('filter')}`, `${this.g('option')} ${this.g('option2')}`);
    }, 800)
  }

  g(s){
    return this.frmSearch.get(s).value;
  }

  onRefresh(){
    this.getData();
  }

  computeTotal() {
    this.ordertotal= this.Data.reduce((a, b) => a + b.ordertotal, 0);
  }

  openOrderDetailsModal(t){
    const { id, customer, rank, subtotal, discount, ordertotal } = t;
    const initialState = {
      id, customer, rank, subtotal, discount, ordertotal
    };
    this.bsModalRef = this.modalService.show(OrderDetailComponent, { class: 'modal-xl', initialState });
    this.bsModalRef.content.closeBtnName='Close';
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
