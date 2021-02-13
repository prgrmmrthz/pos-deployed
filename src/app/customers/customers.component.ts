import { Component, OnInit, ElementRef, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit, OnDestroy {

  modalRef: BsModalRef;
  itemData = [];
  Data = [];
  ranksData=[];
  dataToSave = [];
  logs = [];
  loading = false;
  subs: Subscription;
  selectedValue: string;
  unitData = [];
  customerId: number;
  mode = 1;
  frmX: FormGroup;
  term;
  isSearching = false;
  previousCount = 0;

  constructor(
    private be: BackendService,
    private el: ElementRef,
    private modalService: BsModalService,
    private fb: FormBuilder,
  ) {
    this.frmX = this.fb.group({
      name: ["", Validators.required],
      rank_id: [1, Validators.required]
    });
  }


  ngOnInit(): void {
    this.getRanks();
    this.itemData=[];
    this.getItems();
  }

  getItems(term?: string) {
      this.loading = true;
      let params: Dsmodel = {
        cols: 'c.id,c.name,c.rank_id,r.name as rank',
        table: 'customers c',
        join: 'left join ranks r on r.id=c.rank_id',
        order: 'c.name asc',
        wc: (term) ? `c.name like '%${term}%'` : ''
      }
      this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
        this.itemData= [...d];
      }, (e) => {
        this.loading = false;
        console.error(e);
      }, () => this.loading = false);
  }

  getRanks() {
    this.loading = true;
    let params: Dsmodel = {
      cols: 'id,name',
      table: 'ranks',
      order: 'id asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.ranksData = [...d];
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
    return this.frmX.get(formname).value;
  }

  onSave() {
    this.loading = true;
    let p = '';
    if (this.mode == 2) {
      p = `updateCustomer('${this.g('name')}',${this.g('rank_id')},${this.customerId})`;
    } else {
      p = `insertCustomer('${this.g('name')}',${this.g('rank_id')})`;
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
            this.frmX.reset();
            this.modalRef.hide();
            this.itemData=[];
            this.getItems();
          });
        } else if (x == 3) {
          Swal.fire(
            'Duplicate!',
            `Customer ${this.g('name')} already exist.`,
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
    this.frmX.reset();
    this.modalRef.hide();
  }

  onRefresh() {
    this.isSearching = false;
    this.itemData=[];
    this.getItems();
  }

  onSearch(t) {
    this.isSearching = true;
    this.itemData = [];
    this.getItems(t.target.value);
  }

  onEditProduct(t, template) {
    this.customerId = t.id
    this.frmX.patchValue({
      name: t.name,
      rank_id: t.rank_id || 3
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
        this.be.deleteRecord(id, 'customers', 'id').subscribe((r) => {
          Swal.fire(
            'Deleted!',
            name + ' has been deleted.',
            'success'
          ).then(()=>{
            this.itemData=[];
            this.getItems();
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

  /* updateScrollPos(e) {
    if (e.endReached && !this.isSearching) {
      const c = this.itemData.length;
      this.previousCount = c;
      this.getItems();
    }
  } */

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
