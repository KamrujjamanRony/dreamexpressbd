import { Routes } from '@angular/router';
import { accountGuard } from './guards/account-guard';
import { environment } from '../environments/environment.production';
import { authGuard } from './guards/auth-guard';

const companyName = environment.companyName;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main/main').then(m => m.Main),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./components/main/home/home').then(m => m.Home),
        data: { reuse: true },
        title: `Home | ${companyName}`
      },
      {
        path: 'shop',
        loadComponent: () => import('./components/main/shop/shop').then(m => m.Shop),
        data: { reuse: true },
        title: `Shop | ${companyName}`
      },
      {
        path: 'about-us',
        loadComponent: () => import('./components/main/about/about').then(m => m.About),
        data: { reuse: true },
        title: `About Us | ${companyName}`
      },
      {
        path: 'checkout',
        loadComponent: () => import('./components/main/checkout/checkout').then(m => m.Checkout),
        data: { reuse: true },
        title: `Checkout | ${companyName}`
      },
      {
        path: 'contact-us',
        loadComponent: () => import('./components/main/contact/contact').then(m => m.Contact),
        data: { reuse: true },
        title: `Contact Us | ${companyName}`
      },
      {
        path: 'view/:id',
        loadComponent: () => import('./components/main/product-view/product-view').then(m => m.ProductView),
        data: { reuse: true },
        title: `Product View | ${companyName}`
      },
      {
        path: 'order-confirmation',
        loadComponent: () => import('./components/main/order-confirmation/order-confirmation').then(m => m.OrderConfirmation),
        data: { reuse: true },
        title: `Order Confirmation | ${companyName}`
      },
      {
        path: 'register',
        loadComponent: () => import('./components/main/customer-register/customer-register').then(m => m.CustomerRegister),
        data: { reuse: true },
        title: `Customer Register | ${companyName}`
      },
      {
        path: 'login',
        loadComponent: () => import('./components/main/customer-login/customer-login').then(m => m.CustomerLogin),
        data: { reuse: true },
        title: `Customer Login | ${companyName}`
      },
      {
        path: 'account',
        loadComponent: () => import('./layouts/account/account').then(m => m.Account),
        // canActivate: [accountGuard],
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            loadComponent: () => import('./components/account/profile/profile').then(m => m.Profile),
            title: `Profile Info | ${companyName}`
          },
          {
            path: 'address',
            loadComponent: () => import('./components/account/address/address').then(m => m.Address),
            title: `User Address | ${companyName}`
          },
          {
            path: 'orders',
            loadComponent: () => import('./components/account/orders/orders').then(m => m.Orders),
            title: `My Orders | ${companyName}`
          },
          // {
          //   path: 'wishlist',
          //   loadComponent: () => import('./components/account/wishlist/wishlist').then(m => m.Wishlist),
          //   title: 'Wishlist'
          // },
          {
            path: 'shopping-cart',
            loadComponent: () => import('./components/account/shopping-cart/shopping-cart').then(m => m.ShoppingCart),
            title: `Shopping Cart | ${companyName}`
          },
        ]
      },
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin/admin').then(m => m.Admin),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'admin-list', pathMatch: 'full' },
      {
        path: 'admin-list',
        loadComponent: () => import('./components/admin/users/users').then(m => m.Users),
        title: `Admin List | ${companyName}`,
      },
      {
        path: 'carousel-list',
        loadComponent: () => import('./components/admin/carousel-list/carousel-list').then(m => m.CarouselList),
        title: `Carousel List | ${companyName}`,
      },
      {
        path: 'product-list',
        loadComponent: () => import('./components/admin/product-list/product-list').then(m => m.ProductList),
        title: `Product List | ${companyName}`,
      },
      {
        path: 'order-list',
        loadComponent: () => import('./components/admin/order-list/order-list').then(m => m.OrderList),
        title: `Order List | ${companyName}`,
      },
      {
        path: 'menu-list',
        loadComponent: () => import('./components/admin/menus/menus').then(m => m.Menus),
        title: `Menu List | ${companyName}`,
      },
      {
        path: 'user-list',
        loadComponent: () => import('./components/admin/users/users').then(m => m.Users),
        title: `User List | ${companyName}`,
      },
      {
        path: 'category-list',
        loadComponent: () => import('./components/admin/category-list/category-list').then(m => m.CategoryList),
        title: `Category List | ${companyName}`,
      },
      {
        path: 'brand-list',
        loadComponent: () => import('./components/admin/brand-list/brand-list').then(m => m.BrandList),
        title: `Brand List | ${companyName}`,
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/admin/about-update/about-update').then(m => m.AboutUpdate),
        title: `About Us Update | ${companyName}`,
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./components/admin/contact-update/contact-update').then(m => m.ContactUpdate),
        title: `Contact Us Update | ${companyName}`,
      },
      // {
      //   path: 'wish-list',
      //   loadComponent: () => import('./components/admin/wish-list/wish-list').then(m => m.WishList),
      //   title: 'Wish List',
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./components/admin/settings/settings').then(m => m.Settings),
      //   title: 'Settings',
      // },
    ]
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin/admin-login/admin-login').then(m => m.AdminLogin),
    title: 'Admin Login'
  }
];
