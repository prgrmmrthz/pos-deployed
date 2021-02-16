import { Component, OnInit, ElementRef, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.css']
})
export class DiscountsComponent implements OnInit {
  title="Discounts";
  modalRef: BsModalRef;
  itemData = [];
  Data = [];
  ranksData=[];
  classificationsData=[];
  dataToSave = [];
  logs = [];
  loading = false;
  subs: Subscription;
  selectedValue: string;
  unitData = [];
  discountId: number;
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
      class_id: [1, Validators.required],
      rank_id: [1, Validators.required],
      discount: [0]
    });
  }


  ngOnInit(): void {
    this.getRanks();
    this.getClass();
    this.itemData=[];
    this.getItems();
  }

  getItems(term?: string) {
      this.loading = true;
      let params: Dsmodel = {
        cols: 'd.id,d.rank_id,d.discount,d.class_id,c.name as classification,r.name as rank',
        table: 'discounts d',
        join: 'left join ranks r on r.id=d.rank_id left join classifications c on c.id=d.class_id',
        order: 'r.name asc',
        wc: (term) ? `r.name like '%${term}%' or c.name like '%${term}%'` : ''
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

  getClass() {
    this.loading = true;
    let params: Dsmodel = {
      cols: 'id,name',
      table: 'classifications',
      order: 'id asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.classificationsData = [...d];
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
      p = `updateDiscount(${this.g('rank_id')},${this.g('class_id')},'${this.g('discount')}',${this.discountId})`;
    } else {
      p = `insertDiscount(${this.g('rank_id')},${this.g('class_id')},'${this.g('discount')}')`;
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
            `Discount for this Rank and Class already exist.`,
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
    this.discountId = t.id
    this.frmX.patchValue({
      name: t.name,
      rank_id: t.rank_id,
      class_id: t.class_id,
      discount: t.discount
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

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
