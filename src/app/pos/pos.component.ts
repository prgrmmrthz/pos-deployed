import { Component, OnInit, ElementRef, OnDestroy, TemplateRef, ViewChild, Input, HostListener } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';
import { tap } from 'rxjs/operators';
import { BackendService } from '../backend.service';
import { Router } from '@angular/router';
import { Dsmodel } from '../dsmodel.Interface';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Subscription } from 'rxjs';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/public_api';
import * as es6printJS from "print-js";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css']
})
export class PosComponent implements OnInit, OnDestroy {
  @ViewChild('childModal', { static: false, }) childModal: ModalDirective;
  @ViewChild('paymentModal', { static: false, }) paymentModal: ModalDirective;
  @ViewChild('orderSummary', { static: false, }) orderSummaryModal: ModalDirective;
  @ViewChild('qty') qty: ElementRef;
  orderNumber: number;
  barcode: string;
  subs: Subscription;
  dataItems=[];
  selectedValue: string;
  productData = [];
  loading: boolean;
  logs=[];
  gt: any;
  subtotal=0;
  discount=0;
  ordertotal=0;
  storename='';
  modalRef: BsModalRef;
  frmProduct: FormGroup;
  productId: any;
  modalConfig = {
    keyboard: false,
    class: "modal-lg modal-dialog-scrollable",
    backdrop: false,
    ignoreBackdropClick: true
  };
  mode=1;
  multiMode: boolean;
  change=0;
  amountTendered: number;
  date="";
  time="";

  constructor(
    private be: BackendService,
    private el: ElementRef,
    public router: Router,
    private modalService: BsModalService,
    public fb: FormBuilder
  ) {
    this.frmProduct = this.fb.group({
      name: [{value: "",  disabled: true}],
      qty: [1, [Validators.pattern("^[0-9]*$")]],
      price: [0]
    });
    
   }

  ngOnInit(): void {
    this.checkPreviousOrder();
    this.getProduct();
    this.storename=localStorage.getItem('storename') || '';
    const tinput = this.el.nativeElement.querySelector('#barcode');
    tinput.focus();
    let a = new Date();
    this.date=`${a.getMonth()+1}/${a.getDate()}/${a.getFullYear()}`;
    this.time=`${a.getHours()}:${a.getMinutes()}`;
  }

  onCheckout() {
    this.amountTendered=this.ordertotal;
    this.paymentModal.show();
    this.subs=this.paymentModal.onShown.pipe( tap(() => (document.getElementById('amountTendered') as HTMLElement).focus()) ).subscribe();
  }

  onCancelPayment() {
    this.paymentModal.hide();
  }

  checkPreviousOrder(){
    this.loading = true;
    let p = '';
    p = `checkPreviousOrder()`;
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        if(r[0].res){
          this.createorderNumber();
        }else{
          this.orderNumber=r[0].orderid;
          this.loadOrderDet();
        }
      },
      err => {
        this.loading = false;
        console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
      },
      () => {
        this.loading = false;
      }
    );
  }

  @HostListener('document:keydown.ALT',['$event'])
  handleKeyboardEvent(event: KeyboardEvent){
    event.preventDefault();
    this.multiMode=!this.multiMode;
  }

  @HostListener('document:keydown',['$event'])
  handleSaveEvent(event: KeyboardEvent){
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if (event.ctrlKey && charCode === 's') {
        event.preventDefault();
        this.onCheckout();
        //console.debug(event);
    } 
  }

  createorderNumber(){
    this.loading = true;
    let p = '';
    p = `createOrder()`;
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        this.orderNumber = r[0].res;
      },
      err => {
        this.loading = false;
        console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
      },
      () => {
        this.loading = false;
      }
    );
  }

  getProduct() {
    this.loading = true;
    let params: Dsmodel = {
      cols: 'id,name',
      table: 'products'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.productData = d;
    }, (e) => {
      Swal.fire(
        'Error Loading Data!',
        JSON.stringify(e),
        'error'
      );
      this.loading=false;
    }, () => this.loading = false);
  }

  onEditProduct(t){
    this.subs=this.childModal.onShown.pipe( tap(() => (document.getElementById('qty') as HTMLElement).focus()) ).subscribe();
    this.productId=t.id;
    this.mode=2;
    this.frmProduct.patchValue({
      name: t.name,
      price: t.price,
      qty: t.qty
    });
    
    this.childModal.show();
  }

  onFormSave(){
    let p=this.frmProduct.value.price;
    let q=this.frmProduct.value.qty;
    let a={
      price:p ,
      qty:q,
      total: q*p
    }
    this.addProductOrder(a);
    this.frmProduct.reset();
    this.childModal.hide();
  }

  onPrint(){
    es6printJS({
      printable: 'toPrint', type: 'html',
      targetStyles: [
        'padding-bottom'
      ]
    })
  }

  computeTotal() {
    this.subtotal= this.dataItems.reduce((a, b) => a + b.total, 0);
    this.ordertotal=this.subtotal - this.discount;
  }

  hideChildModal(): void {
    this.childModal.hide();
  }

  onCancel(){
    this.frmProduct.reset();
    this.childModal.hide();
  }

  loadOrderDet(){
    this.loading = true;
    let params: Dsmodel = {
      cols: 'd.id,p.name,d.price,d.qty,d.total',
      table: 'orderdet d',
      wc: 'ordernumber='+this.orderNumber,
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
      this.computeTotal();
      this.multiMode=false;
    });
  }

  onSavePayment(){
    //orderid int, pordertotal decimal(10,2), psukli decimal(10,2)
    let p = `checkoutOrder(${this.orderNumber},'${this.ordertotal}','${this.change}','${this.amountTendered}')`;; 
          const a = { fn: p };
          this.subs = this.be.callSP(a).subscribe(
            r => {
              if(r[0].res){
                this.orderSummaryModal.config=this.modalConfig;
                this.orderSummaryModal.show();
                this.subs=
                this.orderSummaryModal.onShown.pipe( tap(() => (document.getElementById('print') as HTMLElement).focus()) ).subscribe();
                this.paymentModal.hide();
              }
            },
            err => {
              this.loading = false;
              console.debug(err);
              Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
            },
            () => {
              this.loading = false;
            }
          );
  }

  computeChange(){
    this.change=Number((this.amountTendered - this.ordertotal).toFixed(2));
  }

  validatePayment(): boolean{
    if(typeof this.amountTendered==='number' && this.amountTendered >= this.ordertotal){
      return false;
    }else{
      return true;
    }
  }

  newOrder(){
    window.location.reload();
  }

  addProductOrder(d){
    let p = '';
    if(this.mode===2){
       //pid int,pprice decimal(6,2),pqty int,ptotal decimal(6,2)
       p = `editProductOrder(${this.productId},'${d.price}',${d.qty},'${d.total}')`;
    }else{
      p = `addProductToOrder(${this.orderNumber},${this.productId},'${d.price}',${d.qty},'${d.total}')`;
    }  
          const a = { fn: p };
          this.subs = this.be.callSP(a).subscribe(
            r => {
              if(r){
                this.loadOrderDet();
              }
            },
            err => {
              this.loading = false;
              console.debug(err);
              Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
            },
            () => {
              this.loading = false;
              const tinput2 = this.el.nativeElement.querySelector('#barcode');
              tinput2.select();
                    }
          );
          this.mode=1;
          this.computeTotal();
  }

 onSelect(e: TypeaheadMatch): void {
    let params: Dsmodel = {
      cols: 'id,name,price',
      table: 'products',
      limit: '0, 1',
      wc: `id=${e.item.id}`
    }
    this.loading=true;
    let timerInterval;
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      if (d.length > 0) {
        this.productId=d[0].id;
         // pordernumber int,pproduct int,pprice decimal(6,2),pqty int,ptotal decimal(6,2)
         if(!this.multiMode){
           let a={
             qty:1,
             price: d[0].price,
             total: d[0].price
           }
          this.addProductOrder(a);
         }else{
           this.frmProduct.patchValue({
             name: d[0].name,
             price: d[0].price
           })
           this.childModal.show();
         }
      } else {
        Swal.fire({
          title: 'No Product found!',
          icon: 'error',
          html: `<p>Please check barcode.<p><br>auto close in <b></b> milliseconds.`,
          allowEnterKey: true,
          allowEscapeKey: true,
          timer: 500,
          timerProgressBar: true,
          onBeforeOpen: () => {
            Swal.showLoading()
            timerInterval = setInterval(() => {
              const content = Swal.getContent()
              if (content) {
                const b = content.querySelector('b')
                if (b) {
                  b.textContent = Swal.getTimerLeft().toString()
                }
              }
            }, 100)
          },
          onClose: () => {
            clearInterval(timerInterval)
          }
        });
      }
    }, (e) => {
      Swal.fire(
        `Error!`,
        JSON.stringify(e),
        'warning'
      );
      this.loading=false;
    }, () => {
      this.loading=false;
      const tinput = this.el.nativeElement.querySelector('#searchbar');
      tinput.value='';
      const tinput2 = this.el.nativeElement.querySelector('#barcode');
      tinput2.select();
    });
  }

  onBarcode() {
    if(this.barcode.length>0){
      let timerInterval;
      let params: Dsmodel = {
        cols: 'id,name,price',
        table: 'products',
        limit: '0, 1',
        wc: `barcode='${this.barcode}'`
      }
      this.loading=true;
      this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
        if (d.length > 0) {
          if(!this.multiMode){
            this.productId=d[0].id;
            let a={
              qty:1,
              price: d[0].price,
              total: d[0].price
            }
           this.addProductOrder(a);
          }else{
            this.frmProduct.patchValue({
              name: d[0].name,
              price: d[0].price
            })
            this.childModal.show();
          }
        } else {
          Swal.fire({
            title: 'No Product found!',
            icon: 'error',
            html: `<p>Please check barcode.<p><br>auto close in <b></b> milliseconds.`,
            allowEnterKey: true,
            allowEscapeKey: true,
            timer: 500,
            timerProgressBar: true,
            onBeforeOpen: () => {
              Swal.showLoading()
              timerInterval = setInterval(() => {
                const content = Swal.getContent()
                if (content) {
                  const b = content.querySelector('b')
                  if (b) {
                    b.textContent = Swal.getTimerLeft().toString()
                  }
                }
              }, 100)
            },
            onClose: () => {
              clearInterval(timerInterval)
            }
          });
        }
      }, (e) => {
        Swal.fire(
          `Error!`,
          JSON.stringify(e) ,
          'warning'
        );
        this.loading=false;
      }, () => {
        this.loading=false;
        const tinput = this.el.nativeElement.querySelector('#barcode');
        tinput.value='';
        tinput.select();
      });
    }
    this.computeTotal();
  }

  onRemove(id:number, name: string){
    this.loading = true;
    this.subs = this.be.deleteRecord(id, 'orderdet', 'id').subscribe((r) => {
      this.loadOrderDet();
    },(err)=>{
      this.loading = false;
      console.debug(err);
      Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
      
    },()=>{
      this.loading = false;
    });
  }

  onVoid(){
    this.loading = true;
    let p = '';
    p = `voidOrder(${this.orderNumber})`;
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        if(r[0].res){
          this.loadOrderDet();
        }
      },
      err => {
        this.loading = false;
        //console.debug(err);
        Swal.fire(`${err.statusText} ${err.status}`, JSON.stringify(err.error), "error")
      },
      () => {
        this.loading = false;
      }
    );
    this.computeTotal();
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
