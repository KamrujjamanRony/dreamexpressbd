import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock, faFolder, faHome, faGear, faBagShopping, faBuilding, faLayerGroup, faList, faBasketShopping, faChartBar, faChartPie } from '@fortawesome/free-solid-svg-icons';
// import { faStar } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  faLock = faLock;
  faFolder = faFolder;
  faHome = faHome;
  faGear = faGear;
  faBagShopping = faBagShopping;
  faBuilding = faBuilding;
  faLayerGroup = faLayerGroup;
  faList = faList;
  faBasketShopping = faBasketShopping;
  faChartPie = faChartPie;
  faChartBar = faChartBar;
  menu: any[] = [
    {
      title: 'Dashboard',
      icon: faChartPie,
      link: '/admin/dashboard'
    },
    {
      title: 'Products',
      icon: faBasketShopping,
      link: '/admin/product-list'
    },
    {
      title: 'Menu',
      icon: faChartBar,
      link: '/admin/menu-list'
    },
    {
      title: 'Categories',
      icon: faLayerGroup,
      link: '/admin/category-list'
    },
    {
      title: 'Brands',
      icon: faBuilding,
      link: '/admin/brand-list'
    },
    {
      title: 'Orders',
      icon: faBagShopping,
      link: '/admin/order-list'
    },
    {
      title: 'Admins',
      icon: faLock,
      link: '/admin/admin-list'
    },
    {
      title: 'Settings',
      icon: faGear,
      link: '/admin/settings'
    },
    {
      title: 'Home',
      icon: faHome,
      link: '/'
    }
  ];


}
