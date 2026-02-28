import { CommonModule } from '@angular/common';
import { Component, inject, Input, Renderer2 } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { SCart } from '../../../../services/s-cart';
import { SWishlist } from '../../../../services/s-wishlist';
import { SAuthCookie } from '../../../../services/s-auth-cookie';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-image',
  imports: [CommonModule, BdtPipe],
  templateUrl: './view-image.html',
  styleUrl: './view-image.css',
})
export class ViewImage {
  cartService = inject(SCart);
  wishListService = inject(SWishlist);
  authCookieService = inject(SAuthCookie);
  renderer = inject(Renderer2);
  router = inject(Router);
  @Input() product: any;
  count: any = 1;
  viewImage: any;
  viewSize: any;
  viewColor: any;
  warningMsg: any;
  zoomStyle = {};
  user = this.authCookieService.getUserData();

  ngOnInit() {
    this.scrollToTop();
  }

  resetWarningMsg(): void {
    this.warningMsg = null;
  }

  increase() {
    this.count++;
  }

  decrease() {
    this.count--;
  }

  onViewImageClick(img: any) {
    this.viewImage = img;
  }
  onViewSizeClick(size: any) {
    this.viewSize = size;
  }
  onViewColorClick(color: any) {
    this.viewColor = color;
  }

  trackByColor(index: number, color: string): string {
    return color;
  }

  // Function to generate an array of stars based on average rating
  getStarsArray(averageRating: number): boolean[] {
    const roundedRating = Math.round(averageRating * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => index < roundedRating);
  }

  onMouseMove(event: MouseEvent): void {
    const imageContainer = (event.target as HTMLElement).closest('.image-container');
    const img = imageContainer?.querySelector('img') as HTMLImageElement;
    const zoom = imageContainer?.querySelector('.zoom') as HTMLDivElement;

    if (!img || !zoom || !imageContainer) return;

    const containerRect = imageContainer.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const x = event.clientX - containerRect.left;
    const y = event.clientY - containerRect.top;

    const xPercent = (x / containerRect.width) * 100;
    const yPercent = (y / containerRect.height) * 100;

    // Ensure the zoom box stays within the image boundaries
    const zoomBoxWidth = zoom.offsetWidth;
    const zoomBoxHeight = zoom.offsetHeight;
    const zoomBoxLeft = Math.max(0, Math.min(x - zoomBoxWidth / 2, containerRect.width - zoomBoxWidth));
    const zoomBoxTop = Math.max(0, Math.min(y - zoomBoxHeight / 2, containerRect.height - zoomBoxHeight));

    this.zoomStyle = {
      display: 'block',
      backgroundImage: `url(${img.src})`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
      left: `${zoomBoxLeft}px`,
      top: `${zoomBoxTop}px`,
      backgroundSize: `${imgRect.width * 2}px ${imgRect.height * 2}px`,
    };
  }

  onMouseLeave(): void {
    this.zoomStyle = {
      display: 'none',
    };
  }

  addToCart(product: any) {
    const cartProduct = {
      id: crypto.randomUUID(),
      productId: product.id,
      ...(this.viewSize && { selectSize: this.viewSize }),
      ...(this.viewColor && { selectColor: this.viewColor }),
      quantity: this.count
    };

    if (this.user?.uid) {
      this.cartService.getCart(this.user.uid).subscribe({
        next: (cart) => {
          if (cart.length > 0) {
            // Get the first cart (assuming one cart per user)
            let userCart = { ...cart[0] };

            // Check if product exists in cart
            const existingProductIndex = userCart.products.findIndex(
              (p: any) => p.productId == cartProduct.productId
            );

            if (existingProductIndex !== -1) {
              // Product exists - increment quantity
              userCart.products[existingProductIndex].quantity += 1;
            } else {
              // Product doesn't exist - add new product
              userCart.products.push(cartProduct);
            }

            // Update the cart
            this.cartService.updateCart(userCart.id, userCart).subscribe({
              next: () => {
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to cart!');
                // console.log('Cart updated successfully');
                // Optionally: this.router.navigateByUrl('user/shopping-cart');
              },
              error: (error) => {
                console.error('Error updating cart:', error);
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error added to cart'}`);
              }
            });
          } else {
            // No cart exists - create new cart
            const newCart = {
              userId: this.user.uid,
              products: [cartProduct]
            };

            this.cartService.addCart(newCart).subscribe({
              next: () => {
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to cart!');
                // console.log('New cart created successfully');
              },
              error: (error) => {
                console.error('Error creating cart:', error);
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error added to cart'}`);
              }
            });
          }
        },
        error: (error) => {
          // Error fetching cart - create new one
          const newCart = {
            userId: this.user.uid,
            products: [cartProduct]
          };

          this.cartService.addCart(newCart).subscribe({
            next: () => {
              // console.log('New cart created successfully');
            },
            error: (error) => {
              console.error('Error creating cart:', error);
            }
          });
        }
      });
    } else {
      console.error('User not logged in');
      // Optionally redirect to login
    }
  }

  addToWishlist(product: any) {
    // const user = this.authCookieService.getUserData();

    const favoriteProduct = {
      id: crypto.randomUUID(),  // Generate a unique ID for the product
      productId: product.id
    };

    if (this.user?.uid) {
      this.wishListService.getWishlist(this.user.uid).subscribe({
        next: (wishlist) => {
          if (wishlist.length > 0) {
            const restFavoriteProduct = wishlist[0];
            // If the wishlist exists, check if the product is already in the wishlist
            const existingProduct = restFavoriteProduct?.products?.find((p: any) => p.productId == favoriteProduct.productId);

            if (existingProduct) {
              // this.toastService.showMessage('warn', 'Warning', 'Product already in the wish list!');
              // console.log("Product already in the wish list");
              return;
            } else {
              // Add the new product to the wishlist
              restFavoriteProduct.products.push(favoriteProduct);
            }

            // Update the wishlist
            this.wishListService.updateWishlist(restFavoriteProduct.id, restFavoriteProduct).subscribe({
              next: () => {
                // console.log('wishlist updated successfully');
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to wishlist!');
              },
              error: (error) => {
                console.error('Error updating wishlist:', error);
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error creating wishlist'}`);
              }
            });
          } else {
            // If no wishlist exists, create a new wishlist for the user
            const newFavoriteProduct = {
              userId: this.user.uid,
              products: [favoriteProduct]
            };

            this.wishListService.addWishlist(newFavoriteProduct).subscribe({
              next: () => {
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to wishlist!');
                // this.router.navigateByUrl('user/shopping-wishlist');
              },
              error: (error) => {
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error creating wishlist'}`);
              }
            });
          }
        },
        error: (error) => {
          // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error fetching wishlist'}`);
        }
      });
    } else {
      // this.toastService.showMessage('warn', 'Warning', 'User not logged in!');
      console.error('User not logged in');
      this.router.navigateByUrl('login');
    }
  }


  scrollToTop() {
    // Scroll to the top of the page
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

}
