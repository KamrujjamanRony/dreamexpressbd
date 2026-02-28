import { CommonModule } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SCustomer } from '../../../../services/s-customer';

@Component({
  selector: 'app-product-ratting',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-ratting.html',
  styleUrl: './product-ratting.css',
})
export class ProductRatting {
  usersService = inject(SCustomer);
  @Input() product: any;
  ratings = signal<any[]>([]);
  fiveStar = signal<any>([]);
  fourStar = signal<any>([]);
  threeStar = signal<any>([]);
  twoStar = signal<any>([]);
  oneStar = signal<any>([]);
  ratingFilter = signal<any>('');
  sortFilter = signal<any>('');
  userNames = signal<{ [key: string]: string }>({});

  ngOnChanges() {
    if (this.product) {
      this.ratings.set(this.product?.ratings?.reverse());
      this.fiveStar.set(this.product?.ratings.filter((r: any) => r?.ratingValue === 5));
      this.fourStar.set(this.product?.ratings.filter((r: any) => r?.ratingValue === 4));
      this.threeStar.set(this.product?.ratings.filter((r: any) => r?.ratingValue === 3));
      this.twoStar.set(this.product?.ratings.filter((r: any) => r?.ratingValue === 2));
      this.oneStar.set(this.product?.ratings.filter((r: any) => r?.ratingValue === 1));
    }
  }

  onRatingChange() {
    if (this.ratingFilter()) {
      this.ratings.set(this.product?.ratings.filter((r: any) => r?.ratingValue == Number(this.ratingFilter())));
    } else {
      this.ratings.set(this.product?.ratings?.reverse()); // Reset to all ratings if "All" is selected
    }
  }
  onSortChange() {
    let sortedRatings = [...this.ratings()]; // Create a new array to avoid mutation

    if (this.sortFilter() === "asc") {
      // Oldest first (ascending date)
      sortedRatings.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (this.sortFilter() === "desc") {
      // Highest rated first
      sortedRatings.sort((a: any, b: any) => b.ratingValue - a.ratingValue);
    } else if (this.sortFilter() === "ascdesc") {
      // Lowest rated first
      sortedRatings.sort((a: any, b: any) => a.ratingValue - b.ratingValue);
    } else {
      // Newest first (default)
      sortedRatings.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    this.ratings.set(sortedRatings);
  }

  showUserName(id: any): string {
    if (this.userNames()[id]) {
      return this.userNames()[id]; // Return cached value if available
    }

    // Fetch user data
    this.usersService.get(id).subscribe((data: any) => {
      this.userNames.update((users) => ({
        ...users, // Keep existing users
        [id]: data?.fullname || "Unknown", // Add new user
      }));
    });

    return "Loading..."; // Show a placeholder until data loads
  }

  onFilterClear() {
    this.ratingFilter.set('');
    this.sortFilter.set('');
    this.ratings.set(this.product?.ratings?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Reset to all ratings if "Clear" is selected
  }

  // Function to generate an array of stars based on average rating
  getStarsArray(averageRating: number): boolean[] {
    const roundedRating = Math.round(averageRating * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => index < roundedRating);
  }

  timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const key in intervals) {
      const interval = Math.floor(diffInSeconds / intervals[key]);
      if (interval >= 1) {
        return interval === 1 ? `a ${key} ago` : `${interval} ${key}s ago`;
      }
    }

    return "just now";
  }

}
