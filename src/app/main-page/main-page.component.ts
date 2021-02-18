import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackendService } from '../backend.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {
  username:string = '';

  constructor(
    private be: BackendService,
    public router: Router
  ) {
    this.username=localStorage.getItem('username') || '';
  }

  ngOnInit(): void {
  }

  onLogout(){
    localStorage.removeItem('username');
    this.be.setLoggedIn(false);
    this.be.userId = 0;
    this.router.navigate(['/login']);
  }

}
