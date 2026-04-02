import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faBagShopping, faLayerGroup, faBasketShopping, faRightFromBracket, faTicket, faUsers, faGauge, faImages, faTag, faUserShield, faBars, faCircleInfo, faEnvelope, faPhotoFilm, faNewspaper } from '@fortawesome/free-solid-svg-icons';
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
  faRightFromBracket = faRightFromBracket;
  menu: any[] = [
    {
      title: 'Dashboard',
      icon: faGauge,
      link: '/admin/dashboard'
    },
    {
      title: 'Carousels',
      icon: faImages,
      link: '/admin/carousel-list'
    },
    {
      title: 'Categories',
      icon: faLayerGroup,
      link: '/admin/category-list'
    },
    {
      title: 'Brands',
      icon: faTag,
      link: '/admin/brand-list'
    },
    {
      title: 'Products',
      icon: faBasketShopping,
      link: '/admin/product-list'
    },
    {
      title: 'Customers',
      icon: faUsers,
      link: '/admin/customer-list'
    },
    {
      title: 'Orders',
      icon: faBagShopping,
      link: '/admin/order-list'
    },
    {
      title: 'Tokens',
      icon: faTicket,
      link: '/admin/token-list'
    },
    {
      title: 'Admins',
      icon: faUserShield,
      link: '/admin/admin-list'
    },
    // {
    //   title: 'Menu',
    //   icon: faBars,
    //   link: '/admin/menu-3300'
    // },
    {
      title: 'About Us',
      icon: faCircleInfo,
      link: '/admin/about'
    },
    {
      title: 'Contact',
      icon: faEnvelope,
      link: '/admin/contact'
    },
    {
      title: 'Gallery',
      icon: faPhotoFilm,
      link: '/admin/gallery-list'
    },
    {
      title: 'Blog',
      icon: faNewspaper,
      link: '/admin/blog-list'
    },
    {
      title: 'Home',
      icon: faHome,
      link: '/'
    }
  ];


}
