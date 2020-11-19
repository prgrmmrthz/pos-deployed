import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-pos-modal-content',
  templateUrl: './pos-modal-content.component.html',
  styleUrls: ['./pos-modal-content.component.css']
})
export class PosModalContentComponent implements OnInit {
  product;
  frmProduct: FormGroup;
 
  constructor(
    public bsModalRef: BsModalRef,
    public fb: FormBuilder,
  ) {
    this.frmProduct = this.fb.group({
      name: [{value: this.product.name,  disabled: true}],
      qty: [1],
      price: [this.product.price]
    });
  }
 
  ngOnInit() {
  }

  onSave(){

  }

  onCancel(){

  }

}
