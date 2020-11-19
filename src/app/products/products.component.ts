import { Component, OnInit, ElementRef, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/public_api';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 1

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  modalRef: BsModalRef;
  productsData = [];
  Data = [];
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
      price: [0]
    });
  }


  ngOnInit(): void {
    this.productsData=[];
    this.getProducts(0);
  }

  getProducts(page: number, term?: string) {
      this.loading = true;
      let params: Dsmodel = {
        cols: 'id,name,barcode,price',
        table: 'products',
        order: 'name asc',
        limit: `${page},${(term) ? 100 : 1000}`,
        wc: (term) ? `barcode like '%${term}%' or name like '%${term}%'` : ''
      }
      this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
        this.productsData.push(...d);
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
      p = `updateProduct('${this.g('barcode')}', '${this.g('name')}','${this.g('price')}',${this.productId})`;
    } else {
      p = `insertProduct('${this.g('barcode')}', '${this.g('name')}','${this.g('price')}')`;
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
      price: t.price
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
