import { Component, OnInit, OnDestroy, TemplateRef, ElementRef } from '@angular/core';
import { BackendService } from '../backend.service';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { Dsmodel } from '../dsmodel.Interface';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-organic-herbal-inv',
  templateUrl: './organic-herbal-inv.component.html',
  styleUrls: ['./organic-herbal-inv.component.css']
})
export class OrganicHerbalInvComponent implements OnInit, OnDestroy {
  organicData = [];
  unitData = [];
  logs = [];
  loading = false;
  subs: Subscription;
  selectedClass = 1;
  selectedUnit = 1;
  term;
  modalRef: BsModalRef;
  invId: number;

  constructor(
    public router: Router,
    private be: BackendService,
    private modalService: BsModalService,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.getUnit();
  }

  compute(t, v) {
    const tinput = this.el.nativeElement.querySelector('#ti-' + t);
    tinput.value = eval(v);
  }

  getData() {
    ///////////////////////////
    let params: Dsmodel = {
      cols: 'i.id,i.name,i.classid, s.qty, s.unit',
      table: 'items i',
      join: 'left join stocks s on s.item=i.id',
      order: 'i.classid, i.name asc'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.organicData = d.map((v) => {
        return {
          id: v.id,
          name: v.name,
          qty: v.qty || null,
          unit: v.unit || this.selectedUnit
        }
      });
    }, (e) => {
      this.loading = false;
      console.error(e);
    }, () => this.loading = false);
  }

  onCancel() {
    this.modalRef.hide();
  }

  openModal(template: TemplateRef<any>) {
    const config = {
      keyboard: true,
      class: 'modal-sm',
      backdrop: false,
      ignoreBackdropClick: true
    };
    this.modalRef = this.modalService.show(template, config);
  }

  getUnit() {
    ///////////////////////////
    let params: Dsmodel = {
      cols: 'id,name',
      table: 'unitofmeasurement'
    }
    this.subs = this.be.getDataWithJoinClause(params).subscribe(d => {
      this.unitData = d;
    }, (e) => {
      this.loading = false;
      console.error(e);
    }, () => this.loading = false);
  }

  onSave() {
    let a = { fn: `newInventory()` };
    this.be.callSP(a).subscribe(r => {
      const x = r.res[0][0].result;
      if (x > 0) {
        this.invId = x;
        let dataToSave = this.organicData.filter((v) => { return v.qty !== null });
        dataToSave.forEach((v) => {
          let a = { fn: `beginningInventory(${v.id}, '${eval(v.qty).toFixed(2)}', ${v.unit}, ${this.invId})` };
          this.be.callSP(a).subscribe(r => {
            const x = r.res[0][0].result;
            if (x > 0) {
              this.logs.push(`${v.name} : success`);
            }
          },
            (e) => this.logs.push(`${v.name} : error (${e.message})`),
            () => {
              Swal.fire(
                'Finished saving!',
                'Please check log details below.',
                'success'
              ).then(() => {
                let a = { fn: `updateDN(4)` };
                this.be.callSP(a).subscribe(r => {
                  const x = r.res[0][0].result;
                  if (x > 0) {
                    Swal.fire(
                      'Success',
                      'Success updating document number',
                      'info'
                    );
                  }
                },
                  (e) => {
                    Swal.fire(
                      'Error updating document number',
                      JSON.stringify(e),
                      'error'
                    ).then(() => this.router.navigate(['/dashboard']));
                  },
                  () => this.getData());
              });
            });
        });
      }
    },
      (e) => {
        Swal.fire(
          'Error Creating Inventory Number',
          JSON.stringify(e),
          'error'
        ).then(() => this.router.navigate(['/dashboard']));
      });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
