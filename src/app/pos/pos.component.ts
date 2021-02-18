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
  customerId: number;
  orderNumber: number;
  barcode: string;
  subs: Subscription;
  dataItems=[];
  selectedValue: string;
  selectedCustomer = {};
  typeAheadCustomer: string;
  productData = [];
  customersData = [];
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
  customerTitle: string ="Member";

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
      price: [0 ,[Validators.required]],
      discount: [0, [Validators.required]]
    });
   }

  ngOnInit(): void {
    this.checkPreviousOrder();
    setTimeout(()=>{
      this.getProduct();
      this.getCustomers();
      this.storename=localStorage.getItem('storename') || '';
      //const tinput = this.el.nativeElement.querySelector('#barcode');
      //tinput.focus();
      let a = new Date();
      this.date=`${a.getMonth()+1}/${a.getDate()}/${a.getFullYear()}`;
      this.time=`${a.getHours()}:${a.getMinutes()}`;
    }, 1000);
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
          this.customerId = r[0].customerid;
          //console.debug(this.customerId);
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

  @HostListener('document:keydown.F1',['$event'])
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
      cols: 'p.id,p.name,p.price,p.class_id,c.name as class',
      table: 'products p',
      join: 'left join classifications c on c.id=p.class_id',
      order: 'c.name asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.productData = d.map((v,i) => {
        const p = {
          details:  `${v.name} [${v.class}] - P${v.price}`,
          id: v.id,
          name: v.name,
          price: v.price,
          class_id: v.class_id
        };

        return p;
      });
    }, (e) => {
      Swal.fire(
        'Error Loading Data!',
        JSON.stringify(e),
        'error'
      );
      this.loading=false;
    }, () => this.loading = false);
  }

  getCustomers() {
    this.loading = true;
    //console.debug('ito na',this.customerId);
    if(this.customerId){
      let params: Dsmodel = {
        cols: 'c.id, c.name, c.rank_id, r.name as rank',
        table: 'customers c',
        join: 'left join ranks r on r.id=c.rank_id',
        order: 'c.name asc',
        limit : '0,1',
        wc: 'c.id='+this.customerId
      }
      this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
        const a = this.customersData = d.map((v,i) => {
          const customer = {};
          customer['details'] = `${v['name'].toUpperCase()} [${v.rank}]`;
          customer['rank_id'] = v.rank_id;
          customer['id'] = v.id;
          return customer;
        });
        this.selectedCustomer = a[0];
        //console.debug('ito customer',this.selectedCustomer);
      }, (e) => {
        Swal.fire(
          'Error Loading Data!',
          JSON.stringify(e),
          'error'
        );
        this.loading=false;
      }, () => this.loading = false);
    }//if customer

    let params: Dsmodel = {
      cols: 'c.id, c.name, c.rank_id, r.name as rank',
      table: 'customers c',
      join: 'left join ranks r on r.id=c.rank_id',
      order: 'c.name asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.customersData = d.map((v,i) => {
        const customer = {};
        customer['details'] = `${v['name'].toUpperCase()} [${v.rank}]`;
        customer['rank_id'] = v.rank_id;
        customer['id'] = v.id;
        return customer;
      });
    }, (e) => {
      Swal.fire(
        'Error Loading Data!',
        JSON.stringify(e),
        'error'
      );
      this.loading=false;
    }, () => this.loading = false);
  }

  objectMap(object, mapFN){
    return Object.keys(object).reduce((result,key)=>{
      result[key] = mapFN(object[key])
      return result
    }, {})
  }

  onEditProduct(t){
    this.subs=this.childModal.onShown.pipe( tap(() => (document.getElementById('qty') as HTMLElement).focus()) ).subscribe();
    this.productId=t.id;
    this.mode=2;
    this.frmProduct.patchValue({
      name: t.name,
      price: t.price,
      qty: t.qty,
      discount: t.discount
    });

    this.childModal.show();
  }

  onFormSave(){
    const {price,qty,discount} = this.frmProduct.value;
    let a={
      id: this.productId,
      price,
      qty,
      discount,
      total: (price*qty) - discount
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
    this.subtotal= this.dataItems.reduce((a, b) => a + (b.price*b.qty), 0);
    this.discount= this.dataItems.reduce((a, b) => a + b.discount, 0);
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
      cols: 'd.id,p.name,d.price,d.qty,d.total,d.discount,c.name as class',
      table: 'orderdet d',
      wc: 'ordernumber='+this.orderNumber,
      join: 'left join products p on d.product = p.id LEFT JOIN classifications c on c.id = p.class_id',
      order: 'd.id'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.dataItems = [...d];
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
    const p = `checkoutOrder(${this.orderNumber},'${this.ordertotal}','${this.change}','${this.amountTendered}','${this.subtotal}','${this.discount}')`;
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
       p = `editProductOrder(${this.productId},'${d.price}',${d.qty},'${d.total}','${d.discount}')`;
    }else{
      p = `addProductToOrder(${this.orderNumber},${d.id},'${d.price}',${d.qty},'${d.total}','${d.discount}')`;
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
              //const tinput2 = this.el.nativeElement.querySelector('#barcode');
              //tinput2.select();
            }
          );
          this.mode=1;
          this.computeTotal();
  }

 onSelect(e: TypeaheadMatch): void {
    //console.debug(this.selectedCustomer);
    const {price, class_id, id, name} = e.item;
    this.productId=id;
    this.loading=true;
    if(this.selectedCustomer['id']){//if has customer selected
          let params: Dsmodel = {
            cols: 'discount',
            table: 'discounts',
            limit: '0, 1',
            wc: `class_id = ${class_id} and rank_id = ${this.selectedCustomer['rank_id']}`
          }
          this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
            if (d.length > 0) {//if has discount
              const disc = d[0].discount;
              if(!this.multiMode){
                let a={
                  qty:1,
                  price,
                  id,
                  discount: disc,
                  total: price - disc,
                }
              this.addProductOrder(a);
              }else{
                this.frmProduct.patchValue({
                  name: name,
                  price: price,
                  discount: disc,
                  qty: 1
                })
                this.childModal.show();
              }
            }else{
              if(!this.multiMode){
                let a={
                  id,
                  qty:1,
                  price,
                  discount: 0,
                  total: price
                }
              this.addProductOrder(a);
              }else{
                this.frmProduct.patchValue({
                  name: name,
                  price: price,
                  discount: 0,
                  qty: 1
                })
                this.childModal.show();
              }
            }//if else discount []
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
            //const tinput2 = this.el.nativeElement.querySelector('#barcode');
            //tinput2.select();
          });//getData
    }else{
      if(!this.multiMode){
        let a={
          id,
          qty:1,
          price,
          discount: 0,
          total: price
        }
      this.addProductOrder(a);
      }else{
        this.frmProduct.patchValue({
          name: name,
          price: price,
          discount: 0,
          qty: 1
        })
        this.childModal.show();
      }
    }
  }

  onSelectCustomer(e: TypeaheadMatch): void {
    //console.debug(e);
    this.selectedCustomer = e.item;
    this.loading = true;
    let p = `updateOrderCustomer(${e['item'].id},${this.orderNumber})`;
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        const x = r[0].res;

        if (x == 1) {
          Swal.fire(
            'Successfully saved!',
            'Database has been updated.',
            'success'
          );
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
