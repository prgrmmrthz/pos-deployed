import { Component, OnInit, OnDestroy } from '@angular/core';
import { BackendService } from '../backend.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dsmodel } from '../dsmodel.Interface';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2/dist/sweetalert2.js';
var jsPDF = require('jspdf');
require('jspdf-autotable');

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  frmSearch: FormGroup;
  searchOptions: { hKey: string; value: string; icon: string; }[];
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

  constructor(
    private be: BackendService,
    private fb: FormBuilder
  ) {
    this.frmSearch = this.fb.group({
      term: [''],
      option: ['i.name', Validators.required],
      option2: ['asc']
    });

    this.searchOptions=[
      {hKey: 'id', value: 'Order#', icon: ''},
      {hKey: 'date', value: 'Date', icon: ''},
      {hKey: 'ordertotal', value: 'Order Total', icon: ''}
    ]
  }

  ngOnInit(): void {
    this.getData();
    this.storename=localStorage.getItem('storename') || '';
  }

  getData(wc?, order?) {
    let params: Dsmodel = {
      cols: 'id, sukli, amounttendered, DATE_FORMAT(date, "%c-%d-%y %l:%i") as date, ordertotal, sukli, amounttendered',
      table: '`order`',
      order: `${order? order : 'date DESC'}`,
      wc: `${wc? wc : 'status=1'}`
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.Data = d;
    }, (err) => {
      this.loading = false;
        //console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
    }, () => this.loading = false);
  }

  print() {
    var columns = [
      { title: "Item", dataKey: "name" },
      { title: "Old Stock", dataKey: "oldstock" },
      { title: "New P.O", dataKey: "newpo" },
      { title: 'Production', dataKey: 'totalrelease'},
      { title: "Date Updated", dataKey: "date" },
      { title: "Total", dataKey: "total" }
    ];
    var doc = new jsPDF('p', 'pt', 'letter');
    var totalPagesExp = "{total_pages_count_string}";
    doc.autoTable(columns, this.Data, {
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
        total: {
          halign: 'right',
          fontStyle: 'bold'
        },
        oldstock: {
          halign: 'right'
        },
        newpo: {
          halign: 'right'
        },
        date: {
          halign: 'center'
        },
        totalrelease: {
          halign: 'right',
          columnWidth: 60
        }
      },
      didDrawPage: function (dataToPrint) {
        doc.setFontSize(18);
        doc.text(`Stock Report`, 110, 80);
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 120);
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

  loadOrderDet(sukli, amounttendered, ordertotal){
    this.change=sukli;
    this.amountTendered=amounttendered;
    this.ordertotal=ordertotal;
    this.loading = true;
    let params: Dsmodel = {
      cols: 'd.id,p.name,d.price,d.qty,d.total',
      table: 'orderdet d',
      wc: 'ordernumber='+this.selectedId,
      join: 'left join products p on d.product = p.id',
      order: 'id'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.dataItems = d;
    }, (e) => {
      Swal.fire(
        'Error Loading Data!',
        JSON.stringify(e),
        'error'
      );
      this.loading=false;
    }, () => {
      this.loading = false;
    });
  }

  onSearch(){
    let f=this.frmSearch;
    setTimeout(()=>{
      this.getData(`ordertotal like '%${this.g('term')}%'`, `${this.g('option')} ${this.g('option2')}`);
    }, 800)
  }

  g(s){
    return this.frmSearch.get(s).value;
  }

  onRefresh(){
    this.getData();
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
