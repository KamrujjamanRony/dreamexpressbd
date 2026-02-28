import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile-card',
  imports: [FontAwesomeModule],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.css',
})
export class ProfileCard {
    // Icons
    faPencil = faPencil;
    faTrash = faTrash;
    faStar = faStar;

    // Input data
    @Input() data: any = {};

    // Output events
    @Output() edit = new EventEmitter<any>();
    @Output() delete = new EventEmitter<string>();
    @Output() setDefault = new EventEmitter<string>();

    onEdit() {
        this.edit.emit(this.data);
    }

    onDelete() {
        this.delete.emit(this.data.id);
    }

    onSetDefault() {
        this.setDefault.emit(this.data.id);
    }

}
