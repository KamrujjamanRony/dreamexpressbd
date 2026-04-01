import { Routes } from '@angular/router';
import { accountGuard } from './guards/account-guard';
import { environment } from '../environments/environment.production';
import { authGuard } from './guards/auth-guard';

const companyName = environment.companyName;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main/main').then(m => m.Main),
    data: { breadcrumb: '' },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./components/main/home/home').then(m => m.Home),
        data: { breadcrumb: '', reuse: true, seo: { title: 'Home', description: `Welcome to ${companyName} - Shop quality products online with fast delivery across Bangladesh.` } },
        title: `Home | ${companyName}`
      },
      {
        path: 'shop',
        loadComponent: () => import('./components/main/shop/shop').then(m => m.Shop),
        data: { breadcrumb: 'Category', reuse: true, seo: { title: 'Shop', description: `Browse our wide collection of products at ${companyName}. Best prices and fast delivery in Bangladesh.` } },
        title: `Shop | ${companyName}`
      },
      {
        path: 'blogs',
        loadComponent: () => import('./components/main/blogs/blogs').then(m => m.Blogs),
        data: { breadcrumb: 'Blogs', reuse: true, seo: { title: 'Blogs', description: `Read news, guides, and featured stories from ${companyName}.` } },
        title: `Blogs | ${companyName}`
      },
      {
        path: 'blogs/:id',
        loadComponent: () => import('./components/main/blog-view/blog-view').then(m => m.BlogView),
        data: { breadcrumb: 'Blog', reuse: true, seo: { title: 'Blog', description: `Explore detailed stories and updates from ${companyName}.` } },
        title: `Blog View | ${companyName}`
      },
      {
        path: 'about-us',
        loadComponent: () => import('./components/main/about/about').then(m => m.About),
        data: { breadcrumb: 'About Us', reuse: true, seo: { title: 'About Us', description: `Learn about ${companyName} - our mission, vision, and commitment to quality products and customer satisfaction.` } },
        title: `About Us | ${companyName}`
      },
      {
        path: 'checkout',
        loadComponent: () => import('./components/main/checkout/checkout').then(m => m.Checkout),
        data: { breadcrumb: 'Checkout', seo: { noIndex: true } },
        title: `Checkout | ${companyName}`
      },
      {
        path: 'contact-us',
        loadComponent: () => import('./components/main/contact/contact').then(m => m.Contact),
        data: { breadcrumb: 'Contact Us', reuse: true, seo: { title: 'Contact Us', description: `Get in touch with ${companyName}. We are here to help with your orders, questions, and feedback.` } },
        title: `Contact Us | ${companyName}`
      },
      {
        path: 'view/:id',
        loadComponent: () => import('./components/main/product-view/product-view').then(m => m.ProductView),
        data: { breadcrumb: 'Product View', reuse: true, seo: { ogType: 'product' } },
        title: `Product View | ${companyName}`
      },
      {
        path: 'order-confirmation',
        loadComponent: () => import('./components/main/order-confirmation/order-confirmation').then(m => m.OrderConfirmation),
        data: { breadcrumb: 'Order Confirmation', seo: { noIndex: true } },
        title: `Order Confirmation | ${companyName}`
      },
      {
        path: 'register',
        loadComponent: () => import('./components/main/customer-register/customer-register').then(m => m.CustomerRegister),
        data: { breadcrumb: 'Register', seo: { title: 'Register', description: `Create your ${companyName} account to start shopping and track your orders.` } },
        title: `Customer Register | ${companyName}`
      },
      {
        path: 'login',
        loadComponent: () => import('./components/main/customer-login/customer-login').then(m => m.CustomerLogin),
        data: { breadcrumb: 'Login', seo: { title: 'Login', description: `Sign in to your ${companyName} account.`, noIndex: true } },
        title: `Customer Login | ${companyName}`
      },
      {
        path: 'cart',
        loadComponent: () => import('./components/account/shopping-cart/shopping-cart').then(m => m.ShoppingCart),
        data: { breadcrumb: 'Shopping Cart', seo: { noIndex: true } },
        title: `Shopping Cart | ${companyName}`
      },
      {
        path: 'account',
        loadComponent: () => import('./layouts/account/account').then(m => m.Account),
        data: { breadcrumb: 'Account', seo: { noIndex: true } },
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            loadComponent: () => import('./components/account/profile/profile').then(m => m.Profile),
            data: { breadcrumb: 'Profile' },
            title: `Profile Info | ${companyName}`
          },
          {
            path: 'address',
            loadComponent: () => import('./components/account/address/address').then(m => m.Address),
            data: { breadcrumb: 'Address' },
            title: `User Address | ${companyName}`
          },
          {
            path: 'orders',
            loadComponent: () => import('./components/account/orders/orders').then(m => m.Orders),
            data: { breadcrumb: 'My Orders' },
            title: `My Orders | ${companyName}`
          },
          {
            path: 'order-tracking',
            loadComponent: () => import('./components/account/order-tracking/order-tracking').then(m => m.OrderTracking),
            data: { breadcrumb: 'Track Order' },
            title: `Track Order | ${companyName}`
          },
          {
            path: 'wishlist',
            loadComponent: () => import('./components/account/wishlist/wishlist').then(m => m.Wishlist),
            data: { breadcrumb: 'Wishlist' },
            title: `Wishlist | ${companyName}`
          },
          {
            path: 'shopping-cart',
            loadComponent: () => import('./components/account/shopping-cart/shopping-cart').then(m => m.ShoppingCart),
            data: { breadcrumb: 'Shopping Cart' },
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
    data: { breadcrumb: '', seo: { noIndex: true } },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin/dashboard/dashboard').then(m => m.Dashboard),
        data: { breadcrumb: 'Dashboard' },
        title: `Dashboard | ${companyName}`,
      },
      {
        path: 'admin-list',
        loadComponent: () => import('./components/admin/users/users').then(m => m.Users),
        data: { breadcrumb: 'Admin List' },
        title: `Admin List | ${companyName}`,
      },
      {
        path: 'carousel-list',
        loadComponent: () => import('./components/admin/carousel-list/carousel-list').then(m => m.CarouselList),
        data: { breadcrumb: 'Carousel List' },
        title: `Carousel List | ${companyName}`,
      },
      {
        path: 'product-list',
        loadComponent: () => import('./components/admin/product-list/product-list').then(m => m.ProductList),
        data: { breadcrumb: 'Product List' },
        title: `Product List | ${companyName}`,
      },
      {
        path: 'order-list',
        loadComponent: () => import('./components/admin/order-list/order-list').then(m => m.OrderList),
        data: { breadcrumb: 'Order List' },
        title: `Order List | ${companyName}`,
      },
      {
        path: 'menu-list',
        loadComponent: () => import('./components/admin/menus/menus').then(m => m.Menus),
        data: { breadcrumb: 'Menu List' },
        title: `Menu List | ${companyName}`,
      },
      {
        path: 'category-list',
        loadComponent: () => import('./components/admin/category-list/category-list').then(m => m.CategoryList),
        data: { breadcrumb: 'Category List' },
        title: `Category List | ${companyName}`,
      },
      {
        path: 'brand-list',
        loadComponent: () => import('./components/admin/brand-list/brand-list').then(m => m.BrandList),
        data: { breadcrumb: 'Brand List' },
        title: `Brand List | ${companyName}`,
      },
      {
        path: 'customer-list',
        loadComponent: () => import('./components/admin/customer-list/customer-list').then(m => m.CustomerList),
        data: { breadcrumb: 'Customer List' },
        title: `Customer List | ${companyName}`,
      },
      {
        path: 'token-list',
        loadComponent: () => import('./components/admin/token-list/token-list').then(m => m.TokenList),
        data: { breadcrumb: 'Discount Tokens' },
        title: `Discount Tokens | ${companyName}`,
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/admin/about-update/about-update').then(m => m.AboutUpdate),
        data: { breadcrumb: 'About Us' },
        title: `About Us Update | ${companyName}`,
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./components/admin/contact-update/contact-update').then(m => m.ContactUpdate),
        data: { breadcrumb: 'Contact Us' },
        title: `Contact Us Update | ${companyName}`,
      },
      {
        path: 'blog-list',
        loadComponent: () =>
          import('./components/admin/blog-list/blog-list').then(m => m.BlogList),
        data: { breadcrumb: 'Blog List' },
        title: `Blog List | ${companyName}`,
      },
      {
        path: 'gallery-list',
        loadComponent: () =>
          import('./components/admin/gallery-list/gallery-list').then(m => m.GalleryList),
        data: { breadcrumb: 'Image Gallery' },
        title: `Image Gallery | ${companyName}`,
      },
    ]
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin/admin-login/admin-login').then(m => m.AdminLogin),
    data: { breadcrumb: '', seo: { noIndex: true } },
    title: 'Admin Login'
  }
];
