import { Component, OnInit, ElementRef, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackendService } from '../backend.service';
import { Dsmodel } from '../dsmodel.Interface';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/public_api';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-rank-categories',
  templateUrl: './rank-categories.component.html',
  styleUrls: ['./rank-categories.component.css']
})
export class RankCategoriesComponent implements OnInit {

  constructor(){

  }

  ngOnInit(){

  }
}
