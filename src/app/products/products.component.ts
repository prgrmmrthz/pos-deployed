import { Component, OnInit, ElementRef, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/public_api';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  productsData = [];
  Data = [];
  classificationsData=[];
  dataToSave = [];
  logs = [];
  loading = false;
  subs: Subscription;
  selectedValue: string;
  unitData = [];
  productId: number;
  mode = 1;
  frmProduct: FormGroup;
  term;
  isSearching = false;
  previousCount = 0;

  constructor(
    private be: BackendService,
    private el: ElementRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
  ) {
    this.frmProduct = this.fb.group({
      name: ["", Validators.required],
      barcode: [""],
      price: [0],
      unit_price: [0],
      wholesale_price: [0],
      class_id: [1]
    });
  }


  ngOnInit(): void {
    this.getClassifications();
    this.productsData=[];
    this.getProducts(0);
  }

  getProducts(page: number, term?: string) {
      this.loading = true;
      let params: Dsmodel = {
        cols: 'p.id,p.name,p.barcode,p.price,p.unit_price,p.wholesale_price,p.class_id,c.name as classification',
        table: 'products p',
        join: 'left join classifications c on c.id=p.class_id',
        order: 'p.name asc',
        wc: (term) ? `p.barcode like '%${term}%' or p.name like '%${term}%' or c.name like '%${term}%'` : ''
      }
      this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
        this.productsData= [...d];
      }, (e) => {
        this.loading = false;
        console.error(e);
      }, () => this.loading = false);
  }

  getClassifications() {
    this.loading = true;
    let params: Dsmodel = {
      cols: 'id,name',
      table: 'classifications',
      order: 'name asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.classificationsData.push(...d);
    }, (e) => {
      this.loading = false;
      console.error(e);
    }, () => this.loading = false);
  }

  openModal(template: TemplateRef<any>) {
    const config = {
      keyboard: false,
      class: 'modal-md',
      backdrop: false,
      ignoreBackdropClick: true
    };
    this.modalRef = this.modalService.show(template, config);
  }

  g(formname: string): any {
    return this.frmProduct.get(formname).value;
  }

  onSave() {
    this.loading = true;
    let p = '';
    if (this.mode == 2) {
      p = `updateProduct('${this.g('barcode')}', '${this.g('name')}','${this.g('price')}','${this.g('unit_price')}','${this.g('wholesale_price')}','${this.g('class_id')}',${this.productId})`;
    } else {
      p = `insertProduct('${this.g('barcode')}', '${this.g('name')}','${this.g('price')}','${this.g('unit_price')}','${this.g('wholesale_price')}','${this.g('class_id')}')`;
    }
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        const x = r[0].res;

        if (x == 1) {
          Swal.fire(
            'Successfully saved!',
            'Database has been updated.',
            'success'
          ).then(() => {
            this.frmProduct.reset();
            this.modalRef.hide();
            this.productsData=[];
            this.getProducts(0);
          });
        } else if (x == 3) {
          Swal.fire(
            'Duplicate!',
            `Product ${this.g('name')} already exist.`,
            'warning'
          );
        } else {
          Swal.fire(
            'Duplicate!',
            `Barcode ${this.g('barcode')} already exist.`,
            'warning'
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

  onCancel() {
    this.frmProduct.reset();
    this.modalRef.hide();
  }

  onRefresh() {
    this.isSearching = false;
    this.productsData=[];
    this.getProducts(0);
  }

  onSearch(t) {
    this.isSearching = true;
    this.productsData = [];
    this.getProducts(0, t.target.value);
  }

  onEditProduct(t, template) {
    this.productId = t.id
    this.frmProduct.patchValue({
      name: t.name,
      barcode: t.barcode,
      price: t.price,
      unit_price: t.unit_price,
      wholesale_price: t.wholesale_price,
      class_id: t.class_id
    });
    this.loading = false;
    this.mode = 2;
    this.openModal(template);
  }

  onDeleteProduct(id, name) {
    this.loading = true;
    Swal.fire({
      title: 'Delete ' + name + '?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        this.be.deleteRecord(id, 'products', 'id').subscribe((r) => {
          Swal.fire(
            'Deleted!',
            name + ' has been deleted.',
            'success'
          ).then(()=>{
            this.productsData=[];
            this.getProducts(0);
          });
        },()=>{
          alert('error');
          this.loading = false;
        },()=>{

        });
      } else {
        this.loading = false;
      }
    })
  }

  updateScrollPos(e) {
    if (e.endReached && !this.isSearching) {
      const c = this.productsData.length;
      this.previousCount = c;
      this.getProducts(c);
    }
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
