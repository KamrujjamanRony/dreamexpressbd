import { Routes } from '@angular/router';
import { accountGuard } from './guards/account-guard';

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
        title: 'Home'
      },
      {
        path: 'shop',
        loadComponent: () => import('./components/main/shop/shop').then(m => m.Shop),
        data: { reuse: true },
        title: 'Shop'
      },
      {
        path: 'shop/:category',
        loadComponent: () => import('./components/main/shop/shop').then(m => m.Shop),
        data: { reuse: true },
        title: 'Shop'
      },
      {
        path: 'about-us',
        loadComponent: () => import('./components/main/about/about').then(m => m.About),
        data: { reuse: true },
        title: 'About Us'
      },
      {
        path: 'checkout',
        loadComponent: () => import('./components/main/checkout/checkout').then(m => m.Checkout),
        data: { reuse: true },
        title: 'Checkout'
      },
      {
        path: 'contact-us',
        loadComponent: () => import('./components/main/contact/contact').then(m => m.Contact),
        data: { reuse: true },
        title: 'Contact Us'
      },
      {
        path: 'view/:id',
        loadComponent: () => import('./components/main/product-view/product-view').then(m => m.ProductView),
        data: { reuse: true },
        title: 'Product View'
      },
      {
        path: 'order-confirmation',
        loadComponent: () => import('./components/main/order-confirmation/order-confirmation').then(m => m.OrderConfirmation),
        data: { reuse: true },
        title: 'Order Confirmation'
      },
      {
        path: 'account/register',
        loadComponent: () => import('./components/main/customer-register/customer-register').then(m => m.CustomerRegister),
        data: { reuse: true },
        title: 'Customer Register'
      },
      {
        path: 'account/login',
        loadComponent: () => import('./components/main/customer-login/customer-login').then(m => m.CustomerLogin),
        data: { reuse: true },
        title: 'Customer login'
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
            title: 'Profile Info'
          },
          {
            path: 'address',
            loadComponent: () => import('./components/account/address/address').then(m => m.Address),
            title: 'User Address'
          },
          {
            path: 'orders',
            loadComponent: () => import('./components/account/orders/orders').then(m => m.Orders),
            title: 'My Orders'
          },
          {
            path: 'wishlist',
            loadComponent: () => import('./components/account/wishlist/wishlist').then(m => m.Wishlist),
            title: 'Wishlist'
          },
          {
            path: 'shopping-cart',
            loadComponent: () => import('./components/account/shopping-cart/shopping-cart').then(m => m.ShoppingCart),
            title: 'Shopping Cart'
          },
        ]
      },
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin/admin').then(m => m.Admin),
    // canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'admin-list', pathMatch: 'full' },
      {
        path: 'admin-list',
        loadComponent: () => import('./components/admin/users/users').then(m => m.Users),
        title: 'Admin List',
      },
      {
        path: 'product-list',
        loadComponent: () => import('./components/admin/product-list/product-list').then(m => m.ProductList),
        title: 'Product List',
      },
      {
        path: 'order-list',
        loadComponent: () => import('./components/admin/order-list/order-list').then(m => m.OrderList),
        title: 'Order List',
      },
      {
        path: 'menu-list',
        loadComponent: () => import('./components/admin/menus/menus').then(m => m.Menus),
        title: 'Menu List',
      },
      {
        path: 'category-list',
        loadComponent: () => import('./components/admin/category-list/category-list').then(m => m.CategoryList),
        title: 'Category List',
      },
      {
        path: 'brand-list',
        loadComponent: () => import('./components/admin/brand-list/brand-list').then(m => m.BrandList),
        title: 'Brand List',
      },
      // {
      //   path: 'wish-list',
      //   loadComponent: () => import('./components/admin/wish-list/wish-list.component').then(m => m.WishListComponent),
      //   title: 'Wish List',
      // },
      {
        path: 'settings',
        loadComponent: () => import('./components/admin/settings/settings').then(m => m.Settings),
        title: 'Settings',
      },
    ]
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin/admin-login/admin-login').then(m => m.AdminLogin),
    title: 'Admin Login'
  }
];
