import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock, faFolder, faHome, faGear, faBagShopping, faBuilding, faLayerGroup, faList, faBasketShopping, faChartBar, faChartPie, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { SAuth } from '../../../services/s-auth';
// import { faStar } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  auth = inject(SAuth);
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
  faRightFromBracket = faRightFromBracket;
  menu: any[] = [
    {
      title: 'Dashboard',
      icon: faChartPie,
      link: '/admin/dashboard'
    },
    {
      title: 'Carousels',
      icon: faBasketShopping,
      link: '/admin/carousel-list'
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
      title: 'Users',
      icon: faChartBar,
      link: '/admin/user-list'
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
      title: 'About Us',
      icon: faGear,
      link: '/admin/about'
    },
    {
      title: 'Contact',
      icon: faGear,
      link: '/admin/contact'
    },
    {
      title: 'Home',
      icon: faHome,
      link: '/'
    }
  ];


}
