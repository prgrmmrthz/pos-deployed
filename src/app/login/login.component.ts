import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { BackendService } from '../backend.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  frmLogin: FormGroup;
  subs: Subscription;
  loading: boolean;

  constructor(
    private be: BackendService,
    public fb: FormBuilder,
    public router: Router
  ) {
    this.frmLogin = this.fb.group({
      pword: ["", [Validators.required]],
      code: ["" ,[Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  onLogin(){
    this.loading=true;
    const {code, pword} = this.frmLogin.value;
    const p = `login('${code}','${pword}')`;
    const a = { fn: p };
    this.subs = this.be.callSP(a).subscribe(
      r => {
        const a = r[0];
       if(a.res){
        localStorage.setItem('username', a.nameX);
        this.be.setLoggedIn(true);
        this.be.userId = a.idX;
        this.router.navigate(['/system']);
       }else{
        Swal.fire(
          `Login Failed`,
           'please check code and password',
            "error"
        )
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

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

}
