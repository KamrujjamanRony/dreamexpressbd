import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { environment } from '../environments/environment.production';

const companyName = environment.companyName;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main/main').then(m => m.Main),
    data: { breadcrumb: '' },
    children: [
      {
        path: '',
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
        path: 'cart',
        loadComponent: () => import('./components/main/shopping-cart/shopping-cart').then(m => m.ShoppingCart),
        data: { breadcrumb: 'Cart', seo: { noIndex: true } },
        title: `Cart | ${companyName}`
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
      }
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
      {
        path: 'user-list',
        loadComponent: () => import('./components/admin/users/users').then(m => m.Users),
        data: { breadcrumb: 'User List' },
        title: `User List | ${companyName}`,
      }
    ]
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin/admin-login/admin-login').then(m => m.AdminLogin),
    data: { breadcrumb: '', seo: { noIndex: true } },
    title: 'Admin Login'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
