import { Component, inject, signal } from '@angular/core';
import { SCustomer } from '../../../services/s-customer';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
    private usersService = inject(SCustomer);
    // private auth = inject(Auth);
    userId: any;
    id: any;
    loading = signal<boolean>(false);
    model: any = {
        userId: "",
        email: "",
        username: "",
        role: "user",
        fullname: "",
        photoURL: "",
        address: [],
        gender: "",
        dob: "",
        phoneNumber: ""
    };

    // ngOnInit() {
    //     this.auth.onAuthStateChanged((user) => {
    //         this.userId = user?.uid;
    //         this.fetchUser();
    //     });
    // }

    fetchUser() {
        this.usersService.get(this.userId).subscribe(data => {
            this.model = data;
            this.id = data?.id;
        });
    }

    onFormSubmit() {
        const { fullname, username } = this.model;
        this.loading.set(true);
        if (fullname && username) {
            this.usersService.update(this.model.id || this.id, this.model).subscribe({
                next: (response) => {
                    // this.toastService.showMessage('success', 'Success', 'Profile Update successfully');
                    this.id = null;
                    setTimeout(() => {
                        this.loading.set(false);
                    }, 1500);
                },
                error: (error) => {
                    // this.toastService.showMessage('error', 'Error', error.error.message);
                    console.error('Error Update Profile:', error.error);
                    setTimeout(() => {
                        this.loading.set(false);
                    }, 1500);
                }
            });
        } else {
            // this.toastService.showMessage('warn', 'Warning', 'All Fields are required!');
            setTimeout(() => {
                this.loading.set(false);
            }, 1500);
        }

    }

}
