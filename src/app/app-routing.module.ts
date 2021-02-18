import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrganicHerbalInvComponent } from './organic-herbal-inv/organic-herbal-inv.component';
import { ReleaseItemsComponent } from './release-items/release-items.component';
import { AddStockComponent } from './add-stock/add-stock.component';
import { StocksReportComponent } from './stocks-report/stocks-report.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { BarcodeGeneratorComponent } from './barcode-generator/barcode-generator.component';
import { ConstructProductsComponent } from './construct-products/construct-products.component';
import { ProductionComponent } from './production/production.component';
import { ConvertBagComponent } from './convert-bag/convert-bag.component';
import { FoilInventoryComponent } from './foil-inventory/foil-inventory.component';
import { BoxesInventoryComponent } from './boxes-inventory/boxes-inventory.component';
import { BoxesAddStockComponent } from './boxes-add-stock/boxes-add-stock.component';
import { FoilAddStockComponent } from './foil-add-stock/foil-add-stock.component';
import { FoilReportsComponent } from './foil-reports/foil-reports.component';
import { BoxesReportsComponent } from './boxes-reports/boxes-reports.component';
import {ProductsComponent} from './products/products.component';
import {PosComponent} from './pos/pos.component';
import {OrdersComponent} from './orders/orders.component';
import { CustomersComponent } from './customers/customers.component';
import { RankCategoriesComponent } from './rank-categories/rank-categories.component';
import { DiscountsComponent } from './discounts/discounts.component';
import { LoginComponent } from './login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import {AuthGuard} from './auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'system', component: MainPageComponent, canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'pos', pathMatch: 'full' },
      { path: 'organicinv', component: OrganicHerbalInvComponent },
      { path: 'rlsitms', component: ReleaseItemsComponent },
      { path: 'addstock', component: AddStockComponent },
      { path: 'stocksreport', component: StocksReportComponent},
      { path: 'dashboard', component: DashboardComponent},
      { path: 'barcodegenerator', component: BarcodeGeneratorComponent},
      { path: 'constructProducts', component: ConstructProductsComponent},
      { path: 'production', component: ProductionComponent},
      { path: 'convertbag', component: ConvertBagComponent},
      {path:'foil-inventory', component: FoilInventoryComponent},
      {path:'boxes-inventory', component: BoxesInventoryComponent},
      {path:'boxesaddstock', component: BoxesAddStockComponent},
      {path:'foiladdstock', component: FoilAddStockComponent},
      {path:'foilreport', component: FoilReportsComponent},
      {path:'boxesreport', component: BoxesReportsComponent},
      {path:'products', component: ProductsComponent},
      {path:'customers', component: CustomersComponent},
      {path:'customers', component: CustomersComponent},
      {path:'discounts', component: DiscountsComponent},
      {path:'pos', component: PosComponent},
      {path:'orders', component: OrdersComponent},
    ]
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
